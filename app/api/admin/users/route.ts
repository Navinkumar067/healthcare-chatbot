// app/api/admin/users/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with the SERVICE_ROLE_KEY to bypass RLS securely on the server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// Fetch all users
export async function GET(req: Request) {
  try {
    const { data: users, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) throw error;
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle updates (Ban / Document Deletion)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // BANNING
    if (action === 'toggle_ban') {
      const { email, is_banned } = body;
      const { error } = await supabaseAdmin.from('profiles').update({ is_banned }).eq('email', email);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // FILE DELETION
    if (action === 'delete_file') {
      const { fileUrl, userEmail, memberId } = body;
      const fileName = fileUrl.split('/').pop();
      
      // Delete from storage bucket
      if (fileName) {
         await supabaseAdmin.storage.from('reports').remove([fileName]);
      }

      // Update the user's profile array
      const { data: user } = await supabaseAdmin.from('profiles').select('*').eq('email', userEmail).single();
      
      if (memberId) {
        const updatedFamily = user.family_members.map((m: any) =>
          m.id === memberId ? { ...m, file_urls: (m.file_urls || []).filter((fStr: string) => !fStr.includes(fileUrl)) } : m
        );
        await supabaseAdmin.from('profiles').update({ family_members: updatedFamily }).eq('email', userEmail);
      } else {
        const updatedFiles = (user.file_urls || []).filter((fStr: string) => !fStr.includes(fileUrl));
        await supabaseAdmin.from('profiles').update({ file_urls: updatedFiles }).eq('email', userEmail);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle complete user deletion
export async function DELETE(req: Request) {
  try {
    const { email } = await req.json();
    const { error } = await supabaseAdmin.from('profiles').delete().eq('email', email);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}