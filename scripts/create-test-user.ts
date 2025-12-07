
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createTestUser() {
    const args = process.argv.slice(2)
    const email = args[0] || 'test@example.com'
    const password = args[1] || 'Test123!'
    const role = args[2] || 'client' // client, staff, admin, owner
    const fullName = args[3] || 'Test User'

    console.log(`Creating test user with:
    Email: ${email}
    Role: ${role}
    Name: ${fullName}
  `)

    try {
        // 1. Check if user exists
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) throw listError

        let userId
        const existingUser = users.find(u => u.email === email)

        if (existingUser) {
            console.log('User already exists, updating password...')
            userId = existingUser.id
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: password, email_confirm: true }
            )
            if (updateError) throw updateError
        } else {
            console.log('Creating new user in Auth...')
            const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            })
            if (createError) throw createError
            if (!user) throw new Error('User creation failed - no user returned')
            userId = user.id
        }

        console.log(`User Auth ID: ${userId}`)

        // 2. Ensure profile exists and has correct role
        // First try to fetch the profile
        const { data: profile, error: fetchProfileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (fetchProfileError && fetchProfileError.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.warn('Error fetching profile:', fetchProfileError.message)
        }

        if (profile) {
            console.log('Updating existing profile role...')
            const { error: updateProfileError } = await supabaseAdmin
                .from('profiles')
                .update({ role, full_name: fullName })
                .eq('id', userId)

            if (updateProfileError) throw updateProfileError
        } else {
            console.log('Creating new profile...')
            const { error: createProfileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    role: role,
                    full_name: fullName
                })

            if (createProfileError) throw createProfileError
        }

        console.log('\n✅ Test user ready!')
        console.log('------------------------------------------------')
        console.log(`Email:    ${email}`)
        console.log(`Password: ${password}`)
        console.log(`Role:     ${role}`)
        console.log('------------------------------------------------')

    } catch (error: any) {
        console.error('❌ Error creating test user:', error.message)
        process.exit(1)
    }
}

createTestUser()
