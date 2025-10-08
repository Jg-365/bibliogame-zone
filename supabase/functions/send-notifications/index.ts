// Supabase Edge Function for sending email notifications via Gmail
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
// @ts-ignore
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER"); // seu email Gmail
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD"); // senha de app gerada
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") || "https://bibliogame-zone.vercel.app";

interface NotificationData {
  id: string;
  user_id: string;
  notification_type: string;
  trigger_user_id?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  data: any;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error("GMAIL_USER ou GMAIL_APP_PASSWORD não configurados");
    return false;
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `ReadQuest <${GMAIL_USER}>`,
      to,
      subject,
      content: html,
      html,
    });

    await client.close();

    // Delay de 1 segundo entre emails (evitar rate limit do Gmail)
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`✅ Email enviado para: ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${to}:`, error);
    return false;
  }
}

function getEmailTemplate(type: string, data: any): { subject: string; html: string } {
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; }
      .content { padding: 40px 30px; }
      .content h2 { color: #1f2937; margin-top: 0; font-size: 22px; }
      .content p { color: #4b5563; line-height: 1.6; font-size: 16px; }
      .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; margin: 20px 0; font-weight: 600; }
      .button:hover { opacity: 0.9; }
      .footer { background: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
      .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
      .footer a { color: #667eea; text-decoration: none; }
      .unsubscribe { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
      .badge { display: inline-block; background: #f3f4f6; padding: 4px 12px; border-radius: 20px; font-size: 14px; color: #4b5563; margin: 5px 0; }
    </style>
  `;

  switch (type) {
    case "follow":
      return {
        subject: `${data.follower_name} começou a seguir você! 📚`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>🎉 Novo seguidor!</h1>
            </div>
            <div class="content">
              <h2>Olá, ${data.user_name}!</h2>
              <p><strong>${data.follower_name}</strong> agora está seguindo você no ReadQuest!</p>
              <p>Que tal dar uma olhada no perfil e seguir de volta?</p>
              <a href="${SITE_URL}/user/${data.follower_id}" class="button">Ver perfil de ${data.follower_name}</a>
            </div>
            <div class="footer">
              <p>ReadQuest - Sua jornada de leitura gamificada</p>
              <p><a href="${SITE_URL}">Visitar site</a> • <a href="${SITE_URL}/profile">Meu perfil</a></p>
              <div class="unsubscribe">
                <p><a href="${SITE_URL}/profile#notifications">Gerenciar preferências de notificação</a></p>
              </div>
            </div>
          </div>
        `,
      };

    case "post":
      return {
        subject: `${data.author_name} publicou algo novo! ✍️`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>📝 Nova publicação</h1>
            </div>
            <div class="content">
              <h2>Olá, ${data.user_name}!</h2>
              <p><strong>${data.author_name}</strong>, que você segue, acabou de publicar:</p>
              <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1f2937;">${data.post_content}</p>
              </div>
              <a href="${SITE_URL}/social-feed?post=${data.post_id}" class="button">Ver publicação completa</a>
            </div>
            <div class="footer">
              <p>ReadQuest - Sua jornada de leitura gamificada</p>
              <p><a href="${SITE_URL}">Visitar site</a> • <a href="${SITE_URL}/social-feed">Feed social</a></p>
              <div class="unsubscribe">
                <p><a href="${SITE_URL}/profile#notifications">Gerenciar preferências de notificação</a></p>
              </div>
            </div>
          </div>
        `,
      };

    case "comment":
      return {
        subject: `${data.commenter_name} comentou em sua publicação 💬`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>💬 Novo comentário</h1>
            </div>
            <div class="content">
              <h2>Olá, ${data.user_name}!</h2>
              <p><strong>${data.commenter_name}</strong> comentou na sua publicação:</p>
              <div style="background: #f9fafb; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1f2937;">${data.comment_content}</p>
              </div>
              <a href="${SITE_URL}/social-feed?post=${data.post_id}#comment-${data.comment_id}" class="button">Ver comentário</a>
            </div>
            <div class="footer">
              <p>ReadQuest - Sua jornada de leitura gamificada</p>
              <p><a href="${SITE_URL}">Visitar site</a> • <a href="${SITE_URL}/social-feed">Feed social</a></p>
              <div class="unsubscribe">
                <p><a href="${SITE_URL}/profile#notifications">Gerenciar preferências de notificação</a></p>
              </div>
            </div>
          </div>
        `,
      };

    case "like":
      return {
        subject: `${data.liker_name} curtiu sua publicação! ❤️`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>❤️ Nova curtida</h1>
            </div>
            <div class="content">
              <h2>Olá, ${data.user_name}!</h2>
              <p><strong>${data.liker_name}</strong> curtiu a sua publicação!</p>
              <a href="${SITE_URL}/social-feed?post=${data.post_id}" class="button">Ver publicação</a>
            </div>
            <div class="footer">
              <p>ReadQuest - Sua jornada de leitura gamificada</p>
              <p><a href="${SITE_URL}">Visitar site</a> • <a href="${SITE_URL}/social-feed">Feed social</a></p>
              <div class="unsubscribe">
                <p><a href="${SITE_URL}/profile#notifications">Gerenciar preferências de notificação</a></p>
              </div>
            </div>
          </div>
        `,
      };

    case "reading_reminder":
      return {
        subject: `📚 Hora de ler! Mantenha sua sequência ativa`,
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px;">
              <h1 style="color: white; margin: 0; font-size: 32px; display: flex; align-items: center; justify-content: center; gap: 12px;">
                📚 <span>Hora de Ler!</span>
              </h1>
            </div>
            <div class="content" style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Olá, ${
                data.user_name
              }! 👋</h2>
              
              <p style="color: #4b5563; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                Que tal dedicar alguns minutos à leitura hoje?
              </p>
              
              ${
                data.current_streak > 0
                  ? `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #f59e0b;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 32px;">🔥</span>
                    <h3 style="margin: 0; color: #92400e; font-size: 20px;">Sequência Ativa!</h3>
                  </div>
                  <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: 600;">
                    Você está em uma sequência de ${data.current_streak} dias consecutivos!
                  </p>
                  <p style="margin: 5px 0 0 0; color: #b45309; font-size: 14px;">
                    Não deixe ela acabar! Continue hoje mesmo.
                  </p>
                </div>
              `
                  : `
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #3b82f6;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 32px;">✨</span>
                    <h3 style="margin: 0; color: #1e40af; font-size: 20px;">Comece Hoje!</h3>
                  </div>
                  <p style="margin: 0; color: #1e40af; font-size: 16px;">
                    Inicie uma nova sequência de leitura hoje mesmo!
                  </p>
                </div>
              `
              }
              
              ${
                data.currently_reading
                  ? `
                <div style="background: #f8fafc; padding: 25px; margin: 30px 0; border-radius: 12px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 15px;">
                    <span style="font-size: 24px;">📖</span>
                    <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      CONTINUANDO A LER
                    </p>
                  </div>
                  <h4 style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700; line-height: 1.4;">
                    "${data.currently_reading}"
                  </h4>
                </div>
              `
                  : `
                <div style="background: #f1f5f9; padding: 25px; margin: 30px 0; border-radius: 12px; border: 2px dashed #cbd5e1;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
                    <span style="font-size: 24px;">📚</span>
                    <p style="margin: 0; color: #64748b; font-size: 16px;">
                      Escolha um livro para começar
                    </p>
                  </div>
                </div>
              `
              }
              
              <div style="margin-top: 40px;">
                <a href="${SITE_URL}/library" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s;">
                  📚 Acessar Biblioteca
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  💡 <strong>Dica:</strong> Apenas 15-20 minutos por dia já fazem diferença!
                </p>
              </div>
            </div>
            <div class="footer">
              <p>📚 ReadQuest - Sua jornada de leitura gamificada</p>
              <p>
                <a href="${SITE_URL}" style="color: #10b981; text-decoration: none;">🏠 Visitar site</a> • 
                <a href="${SITE_URL}/profile" style="color: #10b981; text-decoration: none;">👤 Meu perfil</a>
              </p>
              <div class="unsubscribe">
                <p><a href="${SITE_URL}/profile#notifications" style="color: #6b7280; text-decoration: none; font-size: 12px;">⚙️ Gerenciar preferências de notificação</a></p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Notificação do ReadQuest",
        html: `
          ${baseStyle}
          <div class="container">
            <div class="header">
              <h1>📬 ReadQuest</h1>
            </div>
            <div class="content">
              <p>Você tem uma nova notificação no ReadQuest!</p>
              <a href="${SITE_URL}" class="button">Acessar ReadQuest</a>
            </div>
            <div class="footer">
              <p>ReadQuest - Sua jornada de leitura gamificada</p>
            </div>
          </div>
        `,
      };
  }
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get pending notifications
    const { data: notifications, error: notifError } = await supabase
      .from("notification_queue")
      .select("*")
      .eq("sent", false)
      .order("created_at", { ascending: true })
      .limit(50); // Process 50 at a time

    if (notifError) throw notifError;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma notificação pendente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const notification of notifications as NotificationData[]) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(notification.user_id);

        if (!userData?.user?.email) {
          failed++;
          continue;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", notification.user_id)
          .single();

        // Get trigger user profile if applicable
        let triggerProfile = null;
        if (notification.trigger_user_id) {
          const { data: tp } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", notification.trigger_user_id)
            .single();
          triggerProfile = tp;
        }

        // Build email data
        const emailData = {
          user_name: profile?.username || "Leitor",
          ...notification.data,
        };

        // Add trigger user name based on notification type
        if (triggerProfile) {
          switch (notification.notification_type) {
            case "follow":
              emailData.follower_name = triggerProfile.username;
              emailData.follower_id = notification.trigger_user_id;
              break;
            case "post":
              emailData.author_name = triggerProfile.username;
              break;
            case "comment":
              emailData.commenter_name = triggerProfile.username;
              break;
            case "like":
              emailData.liker_name = triggerProfile.username;
              break;
          }
        }

        // Get email template
        const { subject, html } = getEmailTemplate(notification.notification_type, emailData);

        // Send email
        const success = await sendEmail(userData.user.email, subject, html);

        if (success) {
          // Mark as sent
          await supabase
            .from("notification_queue")
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq("id", notification.id);
          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error("Erro ao processar notificação:", err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Processamento concluído",
        sent,
        failed,
        total: notifications.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
