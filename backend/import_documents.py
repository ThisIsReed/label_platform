#!/usr/bin/env python3
"""
快速导入文档到数据库的脚本
从JSON文件中读取文档数据并导入到SQLite数据库
"""

import json
import sys
import os
from pathlib import Path
from typing import List, Dict, Any
import argparse
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Document, User


def count_words(text: str) -> int:
    """统计中文字符数（简单统计）"""
    if not text:
        return 0
    # 对于中文，按字符数统计；对于英文，按单词数统计
    chinese_chars = len([c for c in text if '\u4e00' <= c <= '\u9fff'])
    english_words = len([w for w in text.replace('\n', ' ').split(' ') if w.strip()])
    return chinese_chars + english_words


def validate_document_data(doc_data: Dict[str, Any], index: int) -> bool:
    """验证单个文档数据的完整性和格式"""
    errors = []

    # 检查必需字段
    required_fields = ['title', 'source_content', 'generated_content']
    for field in required_fields:
        if not doc_data.get(field):
            errors.append(f"缺少必需字段: {field}")
        elif not isinstance(doc_data[field], str):
            errors.append(f"字段 {field} 必须是字符串类型")

    # 检查字段长度限制
    title = doc_data.get('title', '')
    if isinstance(title, str) and len(title) > 500:
        errors.append(f"标题长度超过500个字符限制")

    # 检查status值
    status = doc_data.get('status', 'pending')
    valid_statuses = ['pending', 'in_progress', 'completed']
    if status not in valid_statuses:
        errors.append(f"无效的status值: {status}，有效值为: {', '.join(valid_statuses)}")

    if errors:
        print(f"警告: 第{index+1}个文档验证失败:")
        for error in errors:
            print(f"  - {error}")
        return False

    return True


def create_document(db: Session, doc_data: Dict[str, Any]) -> Document:
    """创建单个文档记录"""
    # 统计字数
    source_word_count = count_words(doc_data.get('source_content', ''))
    generated_word_count = count_words(doc_data.get('generated_content', ''))

    # 处理assigned_to字段
    assigned_to = doc_data.get('assigned_to')
    if assigned_to is not None:
        # 验证用户是否存在且是专家角色
        target_user = db.query(User).filter(User.id == assigned_to).first()
        if not target_user:
            print(f"警告: 用户ID {assigned_to} 不存在，文档将不被分配")
            assigned_to = None
        elif target_user.role != 'expert':
            print(f"警告: 用户 {target_user.username} 不是专家角色，文档将不被分配")
            assigned_to = None

    # 创建文档对象
    db_document = Document(
        title=doc_data.get('title', ''),
        source_content=doc_data.get('source_content', ''),
        generated_content=doc_data.get('generated_content', ''),
        status=doc_data.get('status', 'pending'),
        assigned_to=assigned_to,
        word_count_source=source_word_count,
        word_count_generated=generated_word_count
    )

    return db_document


def import_documents_from_json(json_file_path: str, db: Session,
                             overwrite: bool = False) -> int:
    """
    从JSON文件导入文档

    Args:
        json_file_path: JSON文件路径
        db: 数据库会话
        overwrite: 是否覆盖已存在的文档（根据标题判断）

    Returns:
        int: 导入的文档数量
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 找不到文件 {json_file_path}")
        return 0
    except json.JSONDecodeError as e:
        print(f"错误: JSON文件格式不正确 - {e}")
        return 0
    except Exception as e:
        print(f"错误: 读取文件时出现问题 - {e}")
        return 0

    # 支持两种JSON格式：单个文档或文档列表
    if isinstance(data, dict):
        documents_data = [data]
    elif isinstance(data, list):
        documents_data = data
    else:
        print("错误: JSON文件根元素必须是对象或数组")
        return 0

    imported_count = 0
    skipped_count = 0

    for i, doc_data in enumerate(documents_data):
        try:
            # 使用新的验证函数验证文档数据
            if not validate_document_data(doc_data, i):
                skipped_count += 1
                continue

            # 检查是否已存在相同标题的文档
            existing_doc = db.query(Document).filter(Document.title == doc_data['title']).first()
            if existing_doc:
                if overwrite:
                    print(f"覆盖已存在的文档: {doc_data['title']}")
                    db.delete(existing_doc)
                    db.commit()
                else:
                    print(f"跳过已存在的文档: {doc_data['title']}")
                    skipped_count += 1
                    continue

            # 创建新文档
            db_document = create_document(db, doc_data)
            db.add(db_document)
            db.commit()
            db.refresh(db_document)

            print(f"导入文档: {doc_data['title']}")
            imported_count += 1

        except Exception as e:
            print(f"错误: 导入第{i+1}个文档时出现问题 - {e}")
            db.rollback()
            skipped_count += 1

    print(f"\n导入完成! 成功: {imported_count}, 跳过: {skipped_count}")
    return imported_count


def list_existing_documents(db: Session) -> None:
    """列出数据库中已存在的文档"""
    documents = db.query(Document).all()
    if not documents:
        print("数据库中暂无文档")
        return

    print(f"\n数据库中现有 {len(documents)} 个文档:")
    for doc in documents:
        print(f"  [{doc.id}] {doc.title} ({doc.status})")


def validate_json_file(json_file_path: str) -> bool:
    """验证JSON文件格式"""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        documents_data = data if isinstance(data, list) else [data]

        # 使用新的验证函数验证每个文档
        all_valid = True
        for i, doc_data in enumerate(documents_data):
            if not isinstance(doc_data, dict):
                print(f"错误: 第{i+1}个文档不是有效的JSON对象")
                all_valid = False
                continue

            if not validate_document_data(doc_data, i):
                all_valid = False

        if all_valid:
            print("JSON文件格式验证通过")
            return True
        else:
            print("JSON文件验证未通过，请修复上述问题后重试")
            return False

    except FileNotFoundError:
        print(f"错误: 找不到文件 {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"错误: JSON文件格式不正确 - {e}")
        return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='导入文档到数据库')
    parser.add_argument('json_file', nargs='?', help='JSON文件路径（使用--create-sample时可选）')
    parser.add_argument('--list', '-l', action='store_true', help='列出数据库中现有的文档')
    parser.add_argument('--overwrite', '-o', action='store_true',
                       help='覆盖已存在的文档（根据标题判断）')
    parser.add_argument('--validate', '-v', action='store_true',
                       help='仅验证JSON文件格式，不导入')
    parser.add_argument('--create-sample', '-s', action='store_true',
                       help='创建示例JSON文件')

    args = parser.parse_args()

    # 创建数据库表
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if args.create_sample:
            create_sample_json_file()
            return

        if args.list:
            list_existing_documents(db)
            return

        if args.validate:
            is_valid = validate_json_file(args.json_file)
            sys.exit(0 if is_valid else 1)

        # 检查JSON文件是否存在
        if not os.path.exists(args.json_file):
            print(f"错误: 找不到文件 {args.json_file}")
            print("提示: 使用 --create-sample 创建示例文件")
            sys.exit(1)

        # 导入文档
        print(f"开始从 {args.json_file} 导入文档...")
        if args.overwrite:
            print("覆盖模式已启用")

        imported_count = import_documents_from_json(
            args.json_file, db, args.overwrite
        )

        if imported_count > 0:
            print(f"\n成功导入 {imported_count} 个文档!")
        else:
            print("\n没有文档被导入")

    except KeyboardInterrupt:
        print("\n\n用户中断操作")
        sys.exit(1)
    except Exception as e:
        print(f"\n错误: {e}")
        sys.exit(1)
    finally:
        db.close()


def create_sample_json_file():
    """创建示例JSON文件"""
    sample_data = [
        {
            "title": "示例文档1：北京经济发展报告",
            "source_content": """2023年北京市实现地区生产总值4.03万亿元，同比增长5.2%。其中，第一产业增加值118.4亿元，第二产业增加值6436.7亿元，第三产业增加值33741.1亿元。三次产业结构为0.3:16.0:83.7。

全市人均地区生产总值达到18.4万元，继续保持全国领先水平。居民消费价格指数上涨1.8%，保持在合理区间。""",
            "generated_content": """根据统计数据，2023年北京市地区生产总值(GDP)突破4万亿元大关，达到4.03万亿元，较上年增长5.2%。这一增长速度高于全国平均水平，显示出北京经济发展的强劲韧性。

从产业结构来看，北京呈现典型的服务业主导特征。第三产业增加值达到3.37万亿元，占GDP比重高达83.7%，体现了北京作为服务业中心的地位。第二产业占比16.0%，主要为高技术制造业和现代制造业。第一产业仅占0.3%，但特色农业发展良好。

人均GDP达到18.4万元，这一数字不仅领先全国，也达到中等发达国家水平。居民消费价格指数上涨1.8%，通胀压力温和，为经济稳定运行创造了良好环境。""",
            "status": "pending",
            "assigned_to": None
        },
        {
            "title": "示例文档2：上海科技创新发展",
            "source_content": """2023年上海市研发经费支出相当于全市生产总值的4.2%，高新技术企业数量超过2.2万家。张江科学城建设加快推进，已集聚各类研发机构500多家。

全市技术合同成交额达到4850亿元，同比增长21.6%。发明专利授权量达到4.8万件，每万人口发明专利拥有量达到81.2件。""",
            "generated_content": """上海在科技创新领域继续保持全国领先地位。2023年，上海研发投入强度达到4.2%，这一比例已达到发达国家水平，体现了城市对科技创新的高度重视。

张江科学城作为上海科技创新的核心承载区，已发展成为全球重要的科技创新中心。目前集聚的500多家研发机构涵盖了从基础研究到应用开发的完整创新链，形成了强大的创新集群效应。

技术市场活跃度显著提升，技术合同成交额达到4850亿元，同比增长21.6%，显示出科技成果转化的强劲势头。发明专利授权量4.8万件，每万人发明专利拥有量81.2件，这些指标均位居全国前列，反映出上海突出的创新能力和知识产权保护水平。""",
            "status": "pending",
            "assigned_to": 2  # 示例：分配给用户ID为2的专家（请根据实际用户ID调整）
        },
        {
            "title": "示例文档3：深圳制造业升级",
            "source_content": """2023年深圳市战略性新兴产业增加值占GDP比重达到41.2%，先进制造业增加值占规模以上工业增加值比重超过60%。全市新增国家高新技术企业超过2000家，总量突破2.2万家。

PCT国际专利申请量连续19年位居全国城市首位，每万人口发明专利拥有量达137.9件。""",
            "generated_content": """深圳作为中国特色社会主义先行示范区，在产业转型升级方面取得显著成效。2023年，战略性新兴产业增加值占GDP比重达到41.2%，这一比例远高于全国平均水平，体现了深圳经济结构的优化质量。

先进制造业发展势头强劲，占规模以上工业增加值比重超过60%，标志着深圳正在从"深圳制造"向"深圳智造"转变。新能源汽车、人工智能、生物医药等产业集群效应明显，形成了完整的产业链条。

创新驱动发展战略深入实施，企业创新能力持续提升。全年新增国家高新技术企业超过2000家，总量突破2.2万家。PCT国际专利申请量连续19年位居全国城市首位，每万人口发明专利拥有量达137.9件，这些指标充分展现了深圳在全球创新版图中的重要地位。""",
            # 注意：这个示例省略了assigned_to字段，文档将不会被分配
        }
    ]

    sample_file = "sample_documents.json"
    with open(sample_file, 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, ensure_ascii=False, indent=2)

    print(f"已创建示例JSON文件: {sample_file}")
    print("文件包含3个示例文档：")
    print("  - 文档1：不分配给专家")
    print("  - 文档2：分配给用户ID为2的专家（请根据实际用户ID调整）")
    print("  - 文档3：省略assigned_to字段的简化示例")
    print("\n请在使用前检查数据库中的用户ID，确保分配给正确的专家用户")


if __name__ == "__main__":
    main()