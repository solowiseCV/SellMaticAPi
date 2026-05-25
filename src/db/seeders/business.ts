import type { PoolClient } from 'pg'
import bcrypt from 'bcryptjs'

const businesses = [
  {
    businessName: 'Fabrics & Fashion Hub',
    ownerName: 'Amara Okonkwo',
    ownerEmail: 'amara@fabricshub.ng',
    ownerPhone: '+2348012345678',
    phoneNumberId: '1116743694855563',
    wabaId: '2026622041611361',
    location: 'Lekki, Lagos',
    password: 'password123',
    deliveryInfo: 'Lagos: ₦1,500 (1-2 days). Outside Lagos: ₦2,500 (3-5 days)',
    paymentInfo: 'Bank transfer, Paystack, or cash on delivery',
    businessDescription: 'Premium African fabrics, traditional wears, and contemporary fashion',
    products: JSON.stringify([
      { name: 'Ankara Print Fabric', price: 2500, sku: 'ANK001' },
      { name: 'Lace Blouse', price: 8500, sku: 'LCE001' },
      { name: 'Traditional Iro Ati Buba', price: 22000, sku: 'TRD001' },
      { name: 'Silk Scarf', price: 5000, sku: 'SKF001' },
      { name: 'Denim Jacket', price: 18000, sku: 'DEN001' }
    ]),
    botActive: true,
    plan: 'free_trial'
  },
  {
    businessName: "Mama Shade's Jollof Rice",
    ownerName: 'Shade Adeyemi',
    ownerEmail: 'shade@mamashadejollof.ng',
    password: 'password123',
    ownerPhone: '+2347045678901',
    phoneNumberId: '1234567890123456',
    wabaId: '9876543210987654',
    location: 'Surulere, Lagos',
    deliveryInfo: 'Lagos delivery: ₦500 (30 mins). Orders by 2 PM for same-day delivery',
    paymentInfo: 'Paystack, Flutterwave, or cash on delivery',
    businessDescription: 'Authentic Nigerian rice dishes, soups, and catering services',
    products: JSON.stringify([
      { name: 'Jollof Rice (Small Pack)', price: 1500, sku: 'JOL001' },
      { name: 'Jollof Rice (Large Pack)', price: 4000, sku: 'JOL002' },
      { name: 'Pepper Soup', price: 2500, sku: 'PEP001' },
      { name: 'Egusi Soup with Fufu', price: 3500, sku: 'EGU001' },
      { name: 'Catering (50 plates)', price: 35000, sku: 'CAT001' }
    ]),
    botActive: true,
    plan: 'free_trial'
  },
  {
    businessName: 'TechHub Electronics',
    ownerName: 'Emeka Obi',
    ownerEmail: 'emeka@techubnig.com',
    password: 'password123',
    ownerPhone: '+2348191234567',
    phoneNumberId: '2222222222222222',
    wabaId: '3333333333333333',
    location: 'Computer Village, Lagos',
    deliveryInfo: 'Lagos: ₦2,000 (same day). Nigeria-wide: ₦5,000 (2-5 days)',
    paymentInfo: 'Bank transfer, crypto, or collect payment',
    businessDescription: 'Electronics repair, phone accessories, and computer hardware',
    products: JSON.stringify([
      { name: 'iPhone Screen Replacement', price: 15000, sku: 'IPH001' },
      { name: 'Infinix Phone Case', price: 3500, sku: 'INF001' },
      { name: 'USB-C Fast Charger', price: 8000, sku: 'USB001' },
      { name: 'Laptop Repair Service', price: 10000, sku: 'LAP001' },
      { name: 'Screen Protector (Pack of 3)', price: 2000, sku: 'SCP001' }
    ]),
    botActive: true,
    plan: 'free_trial'
  },
  {
    businessName: 'Glow & Radiance Beauty',
    ownerName: 'Chioma Nwankwo',
    ownerEmail: 'chioma@glowradiance.ng',
    password: 'password123',
    ownerPhone: '+2349087654321',
    phoneNumberId: '4444444444444444',
    wabaId: '5555555555555555',
    location: 'Ikoyi, Lagos',
    deliveryInfo: 'Lagos: ₦1,000 (1-2 days). Outside Lagos: ₦3,000 (4-7 days)',
    paymentInfo: 'Paystack, bank transfer, or collect',
    businessDescription: 'Natural skincare, beauty products, and professional makeup services',
    products: JSON.stringify([
      { name: 'Shea Butter (500ml)', price: 5000, sku: 'SHE001' },
      { name: 'Natural Face Serum', price: 8500, sku: 'SER001' },
      { name: 'Lip Balm', price: 2500, sku: 'LIP001' },
      { name: 'Makeup Starter Kit', price: 12000, sku: 'MAK001' },
      { name: 'Bridal Makeup Service', price: 25000, sku: 'BRD001' }
    ]),
    botActive: true,
    plan: 'free_trial'
  },
  {
    businessName: 'Swift Logistics Express',
    ownerName: 'Adebayo Ogunwole',
    ownerEmail: 'adebayo@swiftlogistics.ng',
    password: 'password123',
    ownerPhone: '+2348123456789',
    phoneNumberId: '6666666666666666',
    wabaId: '7777777777777777',
    location: 'Apapa, Lagos',
    deliveryInfo: 'Lagos intra-state: ₦3,000-₦8,000 (same/next day). Inter-state: ₦8,000-₦20,000 (2-5 days)',
    paymentInfo: 'Bank transfer, cash on delivery, or advance payment',
    businessDescription: 'Fast and reliable logistics, nationwide delivery, warehousing services',
    products: JSON.stringify([
      { name: 'Intra-Lagos Delivery', price: 5000, sku: 'ILD001' },
      { name: 'Inter-State Delivery', price: 12000, sku: 'ISD001' },
      { name: 'Bulk Freight Service', price: 50000, sku: 'BLK001' },
      { name: 'Storage per Month', price: 8000, sku: 'STR001' },
      { name: 'Express Overnight', price: 15000, sku: 'EXP001' }
    ]),
    botActive: true,
    plan: 'free_trial'
  }
]

async function seedBusinesses(client: PoolClient): Promise<string[]> {
  const businessIds: string[] = []
  const hashedPassword = await bcrypt.hash('password123', 10)

  for (const business of businesses) {
    const now = new Date()
    const result = await client.query(
      `INSERT INTO "Business" (
        "businessName", "ownerName", "ownerEmail", "password", "ownerPhone",
        "phoneNumberId", "wabaId", "location", "deliveryInfo",
        "paymentInfo", "businessDescription", "products",
        "botActive", "plan", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT ("ownerEmail") DO UPDATE SET
        "businessName" = EXCLUDED."businessName",
        "ownerName" = EXCLUDED."ownerName",
        "password" = EXCLUDED."password",
        "ownerPhone" = EXCLUDED."ownerPhone",
        "phoneNumberId" = EXCLUDED."phoneNumberId",
        "wabaId" = EXCLUDED."wabaId",
        "location" = EXCLUDED."location",
        "deliveryInfo" = EXCLUDED."deliveryInfo",
        "paymentInfo" = EXCLUDED."paymentInfo",
        "businessDescription" = EXCLUDED."businessDescription",
        "products" = EXCLUDED."products",
        "botActive" = EXCLUDED."botActive",
        "plan" = EXCLUDED."plan",
        "updatedAt" = EXCLUDED."updatedAt"
      RETURNING id`,
      [
        business.businessName,
        business.ownerName,
        business.ownerEmail,
        hashedPassword,
        business.ownerPhone,
        business.phoneNumberId,
        business.wabaId,
        business.location,
        business.deliveryInfo,
        business.paymentInfo,
        business.businessDescription,
        business.products,
        business.botActive,
        business.plan,
        now,
        now
      ]
    )

    businessIds.push(result.rows[0].id)
  }

  return businessIds
}

export default seedBusinesses
