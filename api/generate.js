export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { link } = req.body;
        if (!link) return res.status(400).json({ error: 'Product link is required' });

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // نیا ماسٹر پرامپٹ: 3D گلاس اور ڈارک تھیم ٹیمپلیٹ کے ساتھ
        const prompt = `I am dropshipping this product on eBay UK. Product link/info: ${link}. 
        Please provide ONLY a raw JSON response with two keys:
        1. "title": An optimized, highly searchable eBay SEO title (Maximum 80 characters). STRICT RULE: Do NOT repeat any words. No special symbols.
        2. "description": Create a highly professional, premium eBay product description using the exact 3D Glassmorphism HTML template below. 
        
        TEMPLATE TO USE AND FILL OUT:
        <div style="font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1a1c29 0%, #050507 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
            <div style="max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.5); border-radius: 20px; padding: 40px; text-align: left;">
                
                <!-- Title Section -->
                <h1 style="color: #fbbf24; font-size: 26px; text-transform: uppercase; text-shadow: 0 4px 15px rgba(251, 191, 36, 0.3); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-top: 0; text-align: center;">
                    [INSERT PRODUCT NAME HERE]
                </h1>
                
                <!-- Intro Section -->
                <p style="font-size: 16px; line-height: 1.8; color: #d1d5db; margin-top: 25px;">
                    [INSERT ENGAGING PRODUCT INTRO HERE]
                </p>
                
                <!-- 3D Glass Features Box -->
                <div style="background: rgba(0, 0, 0, 0.4); border-left: 4px solid #10b981; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); padding: 25px; margin: 35px 0; border-radius: 0 15px 15px 0;">
                    <h3 style="color: #10b981; margin-top: 0; font-size: 20px; text-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);">✨ Premium Features</h3>
                    <ul style="color: #e5e7eb; line-height: 2.0; font-size: 15px; margin-bottom: 0;">
                        [INSERT BULLET POINTS HERE USING <li> TAGS]
                    </ul>
                </div>
                
                <!-- Policy Section (Gold Glow) -->
                <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(217, 119, 6, 0.1)); border: 1px solid rgba(251, 191, 36, 0.2); box-shadow: 0 10px 30px rgba(217, 119, 6, 0.15); padding: 25px; border-radius: 15px; margin-top: 35px; text-align: center;">
                    <h3 style="color: #fbbf24; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">📦 Free UK Shipping & 30-Day Returns</h3>
                    <p style="font-size: 14px; color: #d1d5db; margin-bottom: 0; line-height: 1.6;">Shop with absolute confidence! We provide fast, free shipping across the UK and a hassle-free 30-day return policy for your complete peace of mind.</p>
                </div>
                
            </div>
        </div>
        
        INSTRUCTIONS FOR AI: Replace the bracketed placeholders with actual product data. Do NOT include your own CSS. Use ONLY the structure provided. Do NOT include any personal names.`;

        // 2026 کا لیٹسٹ اور 100% ورکنگ ماڈل (gemini-3.5-flash)
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await aiRes.json();
        if (aiData.error) throw new Error("Google API Error: " + aiData.error.message);

        const rawText = aiData.candidates[0].content.parts[0].text;
        const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJsonString);

        return res.status(200).json(parsedResult);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
