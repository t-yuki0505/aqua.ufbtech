<?php
declare(strict_types=1);

mb_language('Japanese');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Tokyo');

$adminEmail = 'info@ufbtech-co.jp';
$fromEmail = 'info@ufbtech-co.jp';
$siteName = 'UFB水産ラボ';
$companyName = 'UFB TECH株式会社';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html', true, 303);
    exit;
}

if (!empty($_POST['_honey'] ?? '')) {
    header('Location: thanks.html', true, 303);
    exit;
}

function field(string $key): string
{
    $value = $_POST[$key] ?? '';
    if (is_array($value)) {
        $value = implode(', ', $value);
    }
    return trim(str_replace(["\r\n", "\r"], "\n", (string)$value));
}

function oneLine(string $value): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $value) ?? '');
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function displayValue(string $value): string
{
    return $value !== '' ? $value : '未入力';
}

function headerName(string $value): string
{
    return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
}

$type = field('お問い合わせ種別');
$company = field('会社名・施設名');
$name = field('お名前');
$email = field('メールアドレス');
$phone = field('電話番号');
$facility = field('施設種別');
$message = field('相談内容');
$privacy = field('個人情報保護方針への同意');

$errors = [];
if ($type === '') {
    $errors[] = 'お問い合わせ種別を選択してください。';
}
if ($name === '') {
    $errors[] = 'お名前を入力してください。';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'メールアドレスを正しく入力してください。';
}
if ($message === '') {
    $errors[] = '相談内容を入力してください。';
}
if ($privacy === '') {
    $errors[] = 'プライバシーポリシーへの同意が必要です。';
}

if ($errors !== []) {
    http_response_code(400);
    echo '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>入力内容をご確認ください</title><link rel="stylesheet" href="css/styles.css"></head><body><main class="section"><div class="container article-shell"><h1>入力内容をご確認ください</h1><ul class="note-list">';
    foreach ($errors as $error) {
        echo '<li>' . h($error) . '</li>';
    }
    echo '</ul><a class="button" href="contact.html">フォームに戻る</a></div></main></body></html>';
    exit;
}

$submittedAt = date('Y-m-d H:i:s') . ' (JST)';
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

$displayCompany = displayValue($company);
$displayPhone = displayValue($phone);
$displayFacility = displayValue($facility);
$displayMessage = displayValue($message);

$customerBody = <<<BODY
{$name} 様

この度は、UFB DUALへお問い合わせいただき、ありがとうございます。
以下の内容で受け付けいたしました。

3営業日以内に担当よりご連絡いたします。

------------------------------------------------------------

【お問い合わせ内容】

貴社名：{$displayCompany}
お名前：{$name} 様
目的：{$type}
施設種別：{$displayFacility}
電話番号：{$displayPhone}
メールアドレス：{$email}
相談内容：
{$displayMessage}

------------------------------------------------------------

UFB TECH株式会社
MAIL：info@ufbtech-co.jp
HP：https://ufbtech-co.jp/
BODY;

$adminBody = <<<BODY
{$siteName} お問い合わせフォームより送信されました。
============================================================

お問い合わせ種別：{$type}
会社名・施設名：{$displayCompany}
お名前：{$name}
施設種別：{$displayFacility}
電話番号：{$displayPhone}
メールアドレス：{$email}
お問い合わせ内容：
{$displayMessage}
同意：{$privacy}

============================================================

送信日時：{$submittedAt}
IPアドレス：{$ip}
送信元ページ：{$referer}
User-Agent：{$userAgent}
BODY;

$safeName = oneLine($name);
$safeType = oneLine($type);
$replyTo = oneLine($email);

$customerSubject = '【UFB DUAL】お問い合わせありがとうございます';
$adminSubject = "【UFB TECH｜UFB水産ラボ】{$safeType} ／ {$safeName}";

$customerHeaders = [
    'MIME-Version: 1.0',
    'From: ' . headerName($companyName) . ' <' . $fromEmail . '>',
    'Reply-To: ' . $fromEmail,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$adminHeaders = [
    'MIME-Version: 1.0',
    'From: ' . headerName($siteName) . ' <' . $fromEmail . '>',
    'Reply-To: ' . $replyTo,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$customerSent = mb_send_mail($email, $customerSubject, $customerBody, implode("\r\n", $customerHeaders), '-f ' . $fromEmail);
$adminSent = mb_send_mail($adminEmail, $adminSubject, $adminBody, implode("\r\n", $adminHeaders), '-f ' . $fromEmail);

if (!$customerSent || !$adminSent) {
    http_response_code(500);
    echo '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>送信できませんでした</title><link rel="stylesheet" href="css/styles.css"></head><body><main class="section"><div class="container article-shell"><h1>送信できませんでした</h1><p>恐れ入りますが、時間をおいて再度お試しいただくか、info@ufbtech-co.jp まで直接お問い合わせください。</p><a class="button" href="contact.html">フォームに戻る</a></div></main></body></html>';
    exit;
}

header('Location: thanks.html', true, 303);
exit;
