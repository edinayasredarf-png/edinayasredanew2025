import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteMailAccount,
  dbGetMailAccountSecret,
  dbListMailAccounts,
  dbUpsertMailAccount,
  type MailAccount,
} from "@/lib/server/mailAccountsDb";
import { isSecretBoxConfigured } from "@/lib/server/secretBox";
import { verifyMailer, isMailerConfigured, type SmtpAccount } from "@/lib/server/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" && e !== null && "status" in e &&
    typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status
      : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

/** Основной ящик из ENV — как псевдо-аккаунт «default» (только для чтения). */
function envAccount(): MailAccount & { env: true } {
  const user = (process.env.SMTP_USER || "").trim();
  const from = (process.env.SMTP_FROM || user).trim();
  return {
    id: "default",
    label: "Основной ящик (ENV)",
    from_name: "",
    from_email: from || user,
    smtp_host: (process.env.SMTP_HOST || "").trim(),
    smtp_port: Number(process.env.SMTP_PORT || 465),
    smtp_secure: (process.env.SMTP_SECURE ?? "true").trim().toLowerCase() !== "false",
    smtp_user: user,
    enabled: isMailerConfigured(),
    has_password: Boolean(process.env.SMTP_PASS),
    created_at: 0,
    env: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const accounts = await dbListMailAccounts();
    return NextResponse.json({
      env: envAccount(),
      accounts,
      secretConfigured: isSecretBoxConfigured(),
    });
  } catch (e) {
    return err(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();

    // Проверка соединения без сохранения
    if (body?.test) {
      let pass: string = body.password || "";
      if (!pass && body.id) {
        const sec = await dbGetMailAccountSecret(body.id);
        pass = sec?.smtp_pass || "";
      }
      if (!body.smtp_host || !body.smtp_user || !pass) {
        return NextResponse.json({ error: "Укажите хост, логин и пароль" }, { status: 400 });
      }
      const account: SmtpAccount = {
        host: body.smtp_host,
        port: Number(body.smtp_port || 465),
        secure: body.smtp_secure ?? true,
        user: body.smtp_user,
        pass,
        from: body.from_name ? `${body.from_name} <${body.from_email}>` : body.from_email,
      };
      try {
        await verifyMailer(account);
        return NextResponse.json({ ok: true, verified: true });
      } catch (e) {
        let error = e instanceof Error ? e.message : "Не удалось подключиться";
        // 535 — сервер отверг логин/пароль: подсказываем типичные причины.
        if (/535|authentication failed|Invalid login|Invalid user or password/i.test(error)) {
          const host = String(body.smtp_host || "").toLowerCase();
          if (host.includes("yandex")) {
            error += ". Яндекс НЕ принимает обычный пароль для SMTP. Нужно: 1) в Яндекс Почте → Настройки → «Почтовые программы» включить доступ по IMAP и «Пароли приложений»; " +
              "2) создать пароль приложения в Яндекс ID → Безопасность → «Пароли приложений» → для «Почты» и вставить ЕГО сюда (не пароль от аккаунта); " +
              "3) логин = полный адрес; порт 465 + SSL.";
          } else if (host.includes("mail.ru") || host.includes("inbox.ru") || host.includes("bk.ru") || host.includes("list.ru")) {
            error += ". Mail.ru требует отдельный «пароль для внешних приложений»: Почта → Настройки → Безопасность → «Пароли для внешних приложений» → создать и вставить сюда (не пароль от аккаунта).";
          } else if (host.includes("gmail")) {
            error += ". Gmail требует включить 2FA и «App password» (Аккаунт Google → Безопасность → Пароли приложений), и использовать его вместо обычного пароля.";
          } else {
            error += ". Проверьте: 1) логин = ПОЛНЫЙ адрес ящика; 2) это пароль именно ящика (у многих провайдеров нужен отдельный пароль для внешних приложений); " +
              "3) в пароле нет лишних пробелов; 4) порт/шифрование: 465 = SSL (secure вкл.), 587 = STARTTLS (secure выкл.).";
          }
        }
        return NextResponse.json(
          { ok: false, verified: false, error },
          { status: 200 }
        );
      }
    }

    if (!isSecretBoxConfigured()) {
      return NextResponse.json(
        { error: "Не задан ключ шифрования (MAIL_SECRET_KEY или AUTH_SESSION_SECRET)" },
        { status: 503 }
      );
    }
    if (!body?.from_email || !body?.smtp_host || !body?.smtp_user) {
      return NextResponse.json({ error: "Заполните адрес, хост и логин" }, { status: 400 });
    }
    const id = await dbUpsertMailAccount({
      id: body.id,
      label: body.label,
      from_name: body.from_name,
      from_email: body.from_email,
      smtp_host: body.smtp_host,
      smtp_port: Number(body.smtp_port || 465),
      smtp_secure: body.smtp_secure ?? true,
      smtp_user: body.smtp_user,
      password: body.password || undefined,
      enabled: body.enabled ?? true,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return err(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteMailAccount(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e, 401);
  }
}
