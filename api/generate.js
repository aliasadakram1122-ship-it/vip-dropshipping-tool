export default async function handler(req, res) {
    // صرف محفوظ پوسٹ (POST) ریکویسٹ کو اجازت دیں
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { link } = req.body;
        if (!link) return res.status(400).json({ error: 'Product link is required' });

        // Vercel Environment سے آپ کی خفیہ API Key اٹھائے گا
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // 1. پراڈکٹ کے لنک سے ڈیٹا نکالنا (Scraping Title)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(link)}`;
        const proxyRes = await fetch(proxyUrl);
        const proxyData = await proxyRes.json();
        
        // ٹائٹل نکالنے کا ریگولر ایکسپریشن
        const titleMatch = proxyData.contents.match(/<title>(.*?)<\/title>/i);
        const productTitle = titleMatch ? titleMatch[1] : link;

        // 2. AI کے لیے ماسٹر پرامپٹ (Prompt)
        const prompt = `I am dropshipping this product on eBay UK. Product info/link: ${productTitle}. 
        Please provide ONLY a JSON response with two keys:
        1. "title": An optimized, highly searchable eBay SEO title (Maximum 80 characters). No special symbols.
        2. "description": A highly professional, plain text product description formatted for eBay. Include Bullet points for features. Do NOT include any HTML tags. Include a standard "Free UK Shipping & 30-Day Returns" policy at the bottom.`;

        // 3. گوگل Gemini سے محفوظ کنکشن
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await aiRes.json();
        if (aiData.error) throw new Error(aiData.error.message);

        // 4. رزلٹ کو کلین کرنا اور ویب سائٹ کو واپس بھیجنا
        const rawText = aiData.candidates[0].content.parts[0].text;
        const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJsonString);

        return res.status(200).json(parsedResult);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to generate listing. ' + error.message });
    }
}
