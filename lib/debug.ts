// Debug utility to check Supabase connection
export async function testSupabaseConnection() {
  try {
    const { supabase } = await import('./db')
    
    // Test a simple query
    const { data, error } = await supabase
      .from('site_settings')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Supabase connection test error:', error)
    return { success: false, error: error.message }
  }
}

