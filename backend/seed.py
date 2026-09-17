"""Seed the FarmConnect NG database with Nigerian sample data.

Usage (from the ``backend`` directory):
    python seed.py

Creates one administrator, several farmers and buyers, and a catalogue of
typical Nigerian farm produce. Safe to run more than once: existing accounts
and listings are left untouched.
"""

from sqlmodel import Session, select

from app.core.database import engine, init_db
from app.core.security import hash_password
from app.models import Product, User, UserRole

ADMIN = {
    "full_name": "Platform Administrator",
    "username": "admin",
    "email": "admin@farmconnect.ng",
    "password": "Admin@123",
    "role": UserRole.admin,
    "state": "FCT",
    "city": "Abuja",
}

FARMERS = [
    {
        "full_name": "Musa Ibrahim",
        "username": "musa_farms",
        "email": "musa@farmconnect.ng",
        "phone": "08031234567",
        "state": "Plateau",
        "city": "Jos North",
        "bio": "Third-generation maize and potato farmer on the Jos Plateau.",
    },
    {
        "full_name": "Ngozi Okafor",
        "username": "ngozi_green",
        "email": "ngozi@farmconnect.ng",
        "phone": "08062345678",
        "state": "Enugu",
        "city": "Nsukka",
        "bio": "Vegetable grower supplying fresh produce across the South East.",
    },
    {
        "full_name": "Abdul Sani",
        "username": "abdul_grains",
        "email": "abdul@farmconnect.ng",
        "phone": "08093456789",
        "state": "Kano",
        "city": "Dawanau",
        "bio": "Grains and legumes trader at Dawanau market.",
    },
    {
        "full_name": "Funmilayo Adeyemi",
        "username": "funmi_roots",
        "email": "funmi@farmconnect.ng",
        "phone": "08024567890",
        "state": "Oyo",
        "city": "Ibadan",
        "bio": "Cassava and plantain processor with over 20 hectares.",
    },
    {
        "full_name": "Terkaa Tersoo",
        "username": "terkaa_yam",
        "email": "terkaa@farmconnect.ng",
        "phone": "08105678901",
        "state": "Benue",
        "city": "Makurdi",
        "bio": "Yam and soybean farmer in the food basket of the nation.",
    },
    {
        "full_name": "Blessing Etim",
        "username": "blessing_cocoa",
        "email": "blessing@farmconnect.ng",
        "phone": "08126789012",
        "state": "Cross River",
        "city": "Ikom",
        "bio": "Cocoa and oil palm producer exporting from the South South.",
    },
]

BUYERS = [
    {
        "full_name": "Chinedu Eze",
        "username": "chinedu_buys",
        "email": "chinedu@farmconnect.ng",
        "phone": "08147890123",
        "state": "Lagos",
        "city": "Ikeja",
    },
    {
        "full_name": "Aisha Bello",
        "username": "aisha_market",
        "email": "aisha@farmconnect.ng",
        "phone": "08168901234",
        "state": "Abuja",
        "city": "Gwagwalada",
    },
    {
        "full_name": "Tunde Bakare",
        "username": "tunde_foods",
        "email": "tunde@farmconnect.ng",
        "phone": "08189012345",
        "state": "Ogun",
        "city": "Abeokuta",
    },
    {
        "full_name": "Halima Yusuf",
        "username": "halima_resto",
        "email": "halima@farmconnect.ng",
        "phone": "08190123456",
        "state": "Kaduna",
        "city": "Zaria",
    },
]

# (farmer username, name, category, description, quantity, unit, price)
PRODUCTS = [
    ("musa_farms", "White Maize", "Grains & Cereals", "Well dried white maize, cleaned and bagged, ready for milling.", 200, "bag", 62000),
    ("musa_farms", "Irish Potatoes", "Tubers & Roots", "Fresh Irish potatoes harvested from the Jos Plateau highlands.", 150, "bag", 58000),
    ("musa_farms", "Soya Beans", "Legumes & Nuts", "Premium soya beans with high oil content, suitable for processing.", 120, "bag", 72000),
    ("ngozi_green", "Fresh Tomatoes", "Vegetables", "Firm, ripe tomatoes in baskets, harvested this week.", 80, "basket", 35000),
    ("ngozi_green", "Habanero Pepper", "Vegetables", "Hot ata rodo pepper, freshly harvested and sorted.", 60, "basket", 30000),
    ("ngozi_green", "Ugwu (Fluted Pumpkin) Leaves", "Vegetables", "Tender ugu leaves, cut fresh every morning.", 100, "bundle", 2500),
    ("abdul_grains", "Local Rice (Ofada)", "Grains & Cereals", "Unpolished local rice with a rich aroma, well winnowed.", 90, "bag", 88000),
    ("abdul_grains", "Cowpea Beans", "Legumes & Nuts", "Clean brown cowpea, free of stones, high protein.", 110, "bag", 95000),
    ("abdul_grains", "Groundnut (Raw)", "Legumes & Nuts", "Shelled raw groundnut for oil milling or roasting.", 130, "bag", 86000),
    ("abdul_grains", "Yellow Maize", "Grains & Cereals", "Yellow maize suitable for poultry feed and flour.", 220, "bag", 60000),
    ("funmi_roots", "Cassava Tubers", "Tubers & Roots", "Mature cassava tubers with high starch yield.", 40, "tonne", 125000),
    ("funmi_roots", "Ripe Plantain", "Fruits", "Large bunches of ripe plantain, sweet and firm.", 300, "bunch", 4200),
    ("funmi_roots", "Garri (White)", "Tubers & Roots", "Freshly processed white garri, sieved and dry.", 150, "bag", 48000),
    ("terkaa_yam", "White Yam Tubers", "Tubers & Roots", "Benue white yam, big tubers, well cured for storage.", 500, "tuber", 1800),
    ("terkaa_yam", "Yam Flour (Elubo)", "Tubers & Roots", "Fine yam flour for smooth amala, sun dried.", 70, "bag", 55000),
    ("terkaa_yam", "Soybean", "Legumes & Nuts", "Food grade soybean, cleaned and bagged.", 100, "bag", 74000),
    ("blessing_cocoa", "Cocoa Beans", "Cash Crops", "Fermented and sun-dried cocoa beans, export grade.", 30, "tonne", 1250000),
    ("blessing_cocoa", "Red Palm Oil", "Cash Crops", "Pure unrefined red palm oil in 25-litre jerrycans.", 200, "jerrycan", 46000),
    ("blessing_cocoa", "Fresh Pineapple", "Fruits", "Sweet Ikom pineapple, harvested at full maturity.", 400, "piece", 1200),
    ("ngozi_green", "Onions (Red)", "Vegetables", "Dry red onions, well cured and sorted.", 70, "bag", 68000),
]


def get_or_create_user(session: Session, data: dict) -> User:
    existing = session.exec(select(User).where(User.username == data["username"])).first()
    if existing:
        return existing
    password = data.pop("password", "password123")
    user = User(hashed_password=hash_password(password), **data)
    data["password"] = password  # keep for potential re-use
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"  + created {user.role.value}: {user.username}")
    return user


def main() -> None:
    init_db()
    print("Seeding FarmConnect NG database...")

    with Session(engine) as session:
        get_or_create_user(session, dict(ADMIN))

        for farmer in FARMERS:
            get_or_create_user(session, {**farmer, "password": "password123", "role": UserRole.farmer})

        for buyer in BUYERS:
            get_or_create_user(session, {**buyer, "password": "password123", "role": UserRole.buyer})

        # Products
        created_products = 0
        for username, name, category, description, quantity, unit, price in PRODUCTS:
            farmer = session.exec(select(User).where(User.username == username)).first()
            if farmer is None:
                continue
            exists = session.exec(
                select(Product).where(
                    Product.farmer_id == farmer.id, Product.name == name
                )
            ).first()
            if exists:
                continue
            session.add(
                Product(
                    farmer_id=farmer.id,
                    name=name,
                    category=category,
                    description=description,
                    quantity=quantity,
                    unit=unit,
                    price=price,
                    state=farmer.state,
                    city=farmer.city,
                    is_available=True,
                )
            )
            created_products += 1

        session.commit()
        print(f"  + created {created_products} product listings")

    print("\nDone.")
    print("Admin login   -> username: admin            password: Admin@123")
    print("Farmer login  -> username: musa_farms       password: password123")
    print("Buyer login   -> username: chinedu_buys     password: password123")


if __name__ == "__main__":
    main()
