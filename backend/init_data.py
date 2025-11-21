#!/usr/bin/env python3
"""
初始化数据库并添加测试数据
"""

from app.database import Base, SessionLocal, engine
from app.models import User, Document
from app.services.auth import get_password_hash

def create_test_data():
    """创建测试数据"""
    db = SessionLocal()

    try:
        # 创建测试用户
        users_data = [
            {
                "username": "admin",
                "full_name": "管理员",
                "email": "admin@example.com",
                "role": "admin",
                "password": "admin123"
            },
            {
                "username": "expert1",
                "full_name": "张教授",
                "email": "zhang@example.com",
                "role": "expert",
                "password": "expert123"
            },
            {
                "username": "expert2",
                "full_name": "李研究员",
                "email": "li@example.com",
                "role": "expert",
                "password": "expert123"
            }
        ]

        created_users = []
        for user_data in users_data:
            # 检查用户是否已存在
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                user = User(
                    username=user_data["username"],
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    role=user_data["role"],
                    hashed_password=get_password_hash(user_data["password"])
                )
                db.add(user)
                created_users.append(user)
                print(f"创建用户: {user_data['username']} ({user_data['full_name']})")
            else:
                created_users.append(existing_user)
                print(f"用户已存在: {user_data['username']}")

        # 创建测试文档
        documents_data = [
            {
                "title": "2023年北京市经济发展概况",
                "source_content": """2023年，北京市面对复杂多变的国内外环境，坚持稳中求进工作总基调，推动高质量发展。全年实现地区生产总值43760.7亿元，比上年增长5.2%。其中，第一产业增加值118.4亿元，增长4.6%；第二产业增加值7525.9亿元，增长4.8%；第三产业增加值36116.4亿元，增长5.3%。三次产业结构为0.3:17.2:82.5。

全市居民人均可支配收入达到77512元，比上年增长5.6%。城镇居民人均可支配收入82517元，增长5.4%；农村居民人均可支配收入32836元，增长7.1%。城乡居民收入比持续缩小至2.51:1。

科技创新能力持续提升。全市研发经费支出占地区生产总值比重达到6.5%左右。每万人发明专利拥有量达到218.3件，位居全国前列。""",
                "generated_content": """2023年北京市经济发展成就显著

2023年，北京市在复杂多变的国内外经济环境中，始终坚持稳中求进的工作总基调，全面推进高质量发展战略，取得了令人瞩目的经济成就。根据统计数据显示，全年地区生产总值达到43760.7亿元，同比增长5.2%，这一增长率在全国主要城市中处于领先地位。

从产业结构来看，北京市的经济发展呈现以下特点：

第一产业：实现增加值118.4亿元，同比增长4.6%。虽然占比仅为0.3%，但体现了都市型农业的稳定发展。

第二产业：实现增加值7525.9亿元，同比增长4.8%，占比17.2%。高新技术制造业和现代制造业快速发展，为工业经济注入了新动能。

第三产业：实现增加值36116.4亿元，同比增长5.3%，占比高达82.5%。金融业、信息服务业、科技服务业等现代服务业成为经济增长的主要驱动力。

在民生福祉方面，2023年北京市居民收入水平稳步提升：
- 全市居民人均可支配收入达到77512元，增长5.6%
- 城镇居民人均可支配收入82517元，增长5.4%
- 农村居民人均可支配收入32836元，增长7.1%
- 城乡居民收入比缩小至2.51:1，收入分配更加均衡

科技创新是北京发展的核心优势。2023年，全市研发经费支出占GDP比重达到6.5%左右，这一比例远高于全国平均水平。每万人发明专利拥有量达到218.3件，继续领跑全国，彰显了北京作为科技创新中心的实力。

总体而言，2023年北京市经济发展稳中有进，产业结构持续优化，民生福祉不断改善，创新能力显著增强，为建设国际一流的和谐宜居之都奠定了坚实的经济基础。"""
            },
            {
                "title": "上海浦东新区开放开发30周年回顾",
                "source_content": """1990年4月18日，中国政府宣布开发开放上海浦东，浦东的开发开放进入实质性阶段。30年来，浦东从一片农田滩涂发展成为现代化新城。

经济总量快速增长。1990年浦东新区生产总值为60亿元，2022年达到1.6万亿元，增长了260多倍。财政总收入从1990年的11亿元增长到2022年的4000多亿元。

金融贸易功能不断增强。陆家嘴金融贸易区集聚了6000多家各类金融机构，外资金融机构占比超过50%。上海证券交易所、期货交易所等要素市场相继设立。

科技创新成果丰硕。张江科学城建成，集聚了大量科研院所和高新技术企业。科创板设立，为科技创新企业提供了融资平台。

对外开放水平持续提升。外高桥保税区、洋山深水港等对外开放平台相继建立，吸引了大量外资企业落户。""",
                "generated_content": """浦东开发开放30周年的辉煌历程与成就

1990年4月18日，是一个具有里程碑意义的日子。这一天，中国政府正式宣布开发开放上海浦东，这标志着浦东的开发开放进入实质性阶段。转眼间30年过去，浦东这片曾经以农田滩涂为主的土地，已经蜕变成一座举世瞩目的现代化新城。

经济发展：从量变到质变的跨越

浦东新区的经济发展创造了令人瞩目的奇迹：
- 1990年地区生产总值仅为60亿元
- 2022年地区生产总值达到1.6万亿元
- 30年间增长了260多倍，创造了世界城市发展史上的奇迹

财政实力的变化同样惊人：
- 1990年财政总收入仅11亿元
- 2022年财政总收入超过4000亿元
- 财政实力的增长为浦东的持续发展提供了强有力的保障

金融中心：从无到有的崛起

陆家嘴金融贸易区的发展是浦东开发开放的缩影：
- 集聚了6000多家各类金融机构
- 外资金融机构占比超过50%
- 上海证券交易所、期货交易所等重要要素市场相继设立并发展壮大
- 浦东已成为国内外金融机构聚集的高地

科技创新：引领未来的力量

张江科学城的建设体现了浦东在科技创新方面的雄心：
- 集聚了大量科研院所和高新技术企业
- 成为上海科技创新中心的核心承载区
- 科创板的设立为科技创新企业提供了重要的融资平台
- 创新生态体系日趋完善，创新活力持续迸发

对外开放：连接世界的桥梁

浦东的对外开放水平不断提升：
- 外高桥保税区作为中国第一个保税区，为对外开放探索了宝贵经验
- 洋山深水港的建设提升了上海的港口竞争力
- 吸引了大量外资企业落户，成为外资进入中国的重要门户
- 对外开放平台的多元化发展，为浦东融入全球经济提供了重要支撑

展望未来，浦东新区将继续发挥改革开放的试验田作用，在更高起点上推进改革开放，为上海建设成为具有世界影响力的社会主义现代化国际大都市做出新的更大贡献。"""
            }
        ]

        for doc_data in documents_data:
            # 检查文档是否已存在
            existing_doc = db.query(Document).filter(Document.title == doc_data["title"]).first()
            if not existing_doc:
                document = Document(
                    title=doc_data["title"],
                    source_content=doc_data["source_content"],
                    generated_content=doc_data["generated_content"],
                    word_count_source=len(doc_data["source_content"]),
                    word_count_generated=len(doc_data["generated_content"])
                )
                db.add(document)
                print(f"创建文档: {doc_data['title']}")
            else:
                print(f"文档已存在: {doc_data['title']}")

        db.commit()
        print("\n测试数据创建完成！")
        print("\n登录信息：")
        print("管理员：admin / admin123")
        print("专家1：expert1 / expert123")
        print("专家2：expert2 / expert123")

    except Exception as e:
        print(f"创建测试数据失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成！")

    print("\n正在创建测试数据...")
    create_test_data()