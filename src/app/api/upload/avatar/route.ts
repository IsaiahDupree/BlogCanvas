import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.'
            }, { status: 400 })
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            return NextResponse.json({
                success: false,
                error: 'File too large. Maximum size is 2MB.'
            }, { status: 400 })
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('client-files')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({
                success: false,
                error: 'Failed to upload file'
            }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('client-files')
            .getPublicUrl(filePath)

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id)

        if (updateError) {
            console.error('Profile update error:', updateError)
            // Clean up uploaded file
            await supabase.storage.from('client-files').remove([filePath])
            return NextResponse.json({
                success: false,
                error: 'Failed to update profile'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            avatar_url: publicUrl
        })

    } catch (error: any) {
        console.error('Avatar upload error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// Delete old avatar
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Get current avatar URL
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()

        if (!profile?.avatar_url) {
            return NextResponse.json({
                success: false,
                error: 'No avatar to delete'
            }, { status: 400 })
        }

        // Extract file path from URL
        const url = new URL(profile.avatar_url)
        const pathParts = url.pathname.split('/')
        const filePath = pathParts.slice(pathParts.indexOf('avatars')).join('/')

        // Delete from storage
        await supabase.storage.from('client-files').remove([filePath])

        // Update profile to remove avatar URL
        await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user.id)

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Avatar delete error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
