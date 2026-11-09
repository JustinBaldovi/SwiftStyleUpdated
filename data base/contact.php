<?php
$pageTitle = 'Contact Us';
require_once __DIR__ . '/includes/header.php';

$sent = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // In a live deployment this would send an email or store the message in a table.
    // For this demo, we simply acknowledge receipt.
    $sent = true;
}
?>

<section class="section container">
    <div class="contact-hero">
        <h1 class="section-title">Get in <span>Touch</span></h1>
        <p>Have a question about your order or one of our bags? We'd love to hear from you.</p>
    </div>

    <div class="contact-grid">
        <div>
            <?php if ($sent): ?>
                <div class="flash flash-success">Thanks for reaching out! We'll get back to you within 24 hours.</div>
            <?php endif; ?>
            <form method="post" class="form-box" style="margin:0;">
                <div class="form-group">
                    <label for="name">Your Name</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="message">Message</label>
                    <textarea id="message" name="message" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn btn-block">Send Message</button>
            </form>
        </div>

        <div>
            <div class="contact-info-card">
                <h4>📍 Location</h4>
                <p>Davao City, Philippines (Local pickup and nationwide shipping)</p>
                <h4>📧 Email</h4>
                <p>hello@swiftstyleph.com</p>
                <h4>📱 Phone / Viber</h4>
                <p>0917-123-4567</p>
                <h4>💬 Social Media</h4>
                <p>Facebook: /SwiftStylePH<br>Instagram: @swiftstyle.ph<br>TikTok: @swiftstyleph</p>
                <h4>🕒 Business Hours</h4>
                <p>Monday – Saturday, 9:00 AM – 6:00 PM</p>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
