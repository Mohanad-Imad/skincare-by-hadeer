import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch products
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch products with their categories and companies
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name_ar,
        description_ar,
        company,
        skin_type,
        categories!inner(name_ar, parent_id)
      `)
      .limit(100);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Create a product catalog summary for the AI
    const productCatalog = products?.map(p => ({
      id: p.id,
      name: p.name_ar,
      description: p.description_ar,
      company: p.company,
      skin_type: p.skin_type,
      category: Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0].name_ar : null
    })) || [];

    const systemPrompt = `أنت مساعد ذكي لمتجر مستحضرات التجميل والعناية بالبشرة. مهمتك هي:

1. مساعدة العملاء في العثور على المنتجات المناسبة لهم
2. تقديم نصائح متخصصة حول العناية بالبشرة والمكياج
3. الإجابة على أسئلة العملاء حول المنتجات
4. ترشيح المنتجات بناءً على نوع البشرة والمشاكل والاحتياجات
5. زيادة المبيعات من خلال اقتراحات مناسبة

قاعدة بيانات المنتجات المتوفرة:
${JSON.stringify(productCatalog, null, 2)}

إرشادات:
- كن ودوداً ومحترفاً
- اطرح أسئلة لفهم احتياجات العميل (نوع البشرة، المشاكل، الميزانية)
- رشح 2-3 منتجات فقط في كل مرة مع شرح مختصر
- استخدم معرف المنتج (id) عند الترشيح
- شجع العميل على الشراء بطريقة لطيفة
- إذا لم تجد منتج مناسب، اقترح بدائل قريبة

تذكر: هدفك هو تقديم تجربة شراء ممتازة وزيادة المبيعات.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
