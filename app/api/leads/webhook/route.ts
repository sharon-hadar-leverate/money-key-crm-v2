import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Lazy initialization - only create client when needed at runtime
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient<Database>(url, key)
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Webhook not configured - missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 503 }
      )
    }

    // Optional: Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // UTM validation logging - log when key UTM fields are missing
    const utmWarnings: string[] = []
    if (body.utm_source && !body.utm_medium) {
      utmWarnings.push(`utm_medium missing for source: ${body.utm_source}`)
    }
    if (body.utm_source && !body.utm_campaign) {
      utmWarnings.push(`utm_campaign missing for source: ${body.utm_source}`)
    }
    if (body.gclid && !body.utm_source) {
      utmWarnings.push('gclid present but utm_source missing (should be google)')
    }

    if (utmWarnings.length > 0) {
      console.warn('[Webhook UTM Warning]', {
        name: body.name,
        email: body.email,
        warnings: utmWarnings,
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        gclid: body.gclid,
      })
    }

    // Insert lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        first_name: body.first_name,
        last_name: body.last_name,
        source: body.source || 'webhook',
        expected_revenue: body.expected_revenue,
        probability: body.probability,
        custom_fields: body.custom_fields || {},
        utm_source: body.utm_source,
        utm_medium: body.utm_medium,
        utm_campaign: body.utm_campaign,
        utm_content: body.utm_content,
        utm_term: body.utm_term,
        gclid: body.gclid,
        landing_page: body.landing_page,
        referrer: body.referrer,
        ip_address: body.ip_address || request.headers.get('x-forwarded-for'),
        user_agent: body.user_agent || request.headers.get('user-agent'),
        status: 'new',
        is_new: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create lead via webhook:', error)
      return NextResponse.json(
        { error: 'Failed to create lead', details: error.message },
        { status: 500 }
      )
    }

    // Log creation event
    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      event_type: 'created',
      user_email: 'webhook',
      new_value: body.name,
      metadata: {
        source: 'webhook',
        utm_source: body.utm_source,
      },
    })

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      message: 'Lead created successfully',
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is active',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'optional - your webhook secret',
      },
      body: {
        name: 'required - Lead name',
        email: 'optional - Email address',
        phone: 'optional - Phone number',
        utm_source: 'optional - UTM source',
        utm_medium: 'optional - UTM medium',
        utm_campaign: 'optional - UTM campaign',
        custom_fields: 'optional - JSON object with custom fields',
      },
    },
  })
}
