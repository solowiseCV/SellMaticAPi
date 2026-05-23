export async function getBusinessByPhoneNumberId(client: any, phoneNumberId: string) {
  const res = await client.query(
    `SELECT id, "businessName", location, "deliveryInfo", "paymentInfo", products, "botPersonality", "accessToken", "phoneNumberId"
     FROM "Business" WHERE "phoneNumberId" = $1 AND "botActive" = true LIMIT 1`,
    [phoneNumberId]
  )
  return res.rows[0] || null
}
