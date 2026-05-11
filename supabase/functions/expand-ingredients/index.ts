import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface IngredientMapping {
  id: string
  dish_name: string
  aliases: string[]
  ingredients: Array<{
    name: string
    quantity?: number
    unit_type?: string
  }>
}

interface ExpandRequest {
  dishNames: string[]
  userId?: string
}

if (import.meta.main) {
  serve(handleRequest)
}

async function handleRequest(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
    }

    const { dishNames, userId } = await req.json() as ExpandRequest

    if (!dishNames || !Array.isArray(dishNames)) {
      return jsonResponse({ success: false, error: 'dishNames array required' }, 400)
    }

    const userIdParam = userId || null

    const { data: mappings, error } = await supabase
      .from('ingredient_mappings')
      .select('id, dish_name, aliases, ingredients')
      .or(`user_id.eq.${userIdParam},is_global.eq.true`)

    if (error) {
      return jsonResponse({ success: false, error: error.message }, 500)
    }

    const mappingMap = new Map<string, IngredientMapping>()

    for (const m of mappings || []) {
      const normalized = m.dish_name?.toLowerCase().trim() || ''
      mappingMap.set(normalized, m)

      const aliases = m.aliases || []
      for (const alias of aliases) {
        mappingMap.set(alias.toLowerCase().trim(), m)
      }
    }

    const results = dishNames.map((dishName) => {
      const normalized = dishName.toLowerCase().trim()
      const mapping = mappingMap.get(normalized)

      if (mapping) {
        return {
          original: dishName,
          expanded: true,
          ingredients: mapping.ingredients,
          mappingId: mapping.id,
        }
      }

      return {
        original: dishName,
        expanded: false,
        ingredients: [],
        mappingId: null,
      }
    })

    return jsonResponse({ success: true, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('expand-ingredients error:', message)
    return jsonResponse({ success: false, error: message }, 500)
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}