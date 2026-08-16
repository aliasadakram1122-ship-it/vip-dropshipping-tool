export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { link } = req.body;
        if (!link) return res.status(400).json({ error: 'Product link is required' });

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // نیا ماسٹر پرامپٹ: HTML کی اجازت اور الفاظ ریپیٹ نہ کرنے کی سختی
        const prompt = `I am dropshipping this product on eBay UK. Product link/info: ${link}. 
        Please provide ONLY a raw JSON response with two keys:
        1. "title": An optimized, highly searchable eBay SEO title (Maximum 80 characters). STRICT RULE: Do NOT repeat any words. No special symbols.
        2. "description": A highly professional, premium product description formatted for eBay using clean HTML. Use modern styling, <b> tags for headings, and <ul><li> for bullet points. Do NOT include any personal names. Include a standard "Free UK Shipping & 30-Day Returns" policy at the bottom inside a visually distinct HTML section or bold text.`;

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
