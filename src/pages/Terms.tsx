import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Shield, Users, CreditCard, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground">MenuForest Restaurant Management System</p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              Terms of Service Agreement
            </CardTitle>
            <div className="text-center text-sm text-muted-foreground">
              <p><strong>Effective Date:</strong> January 1, 2025</p>
              <p><strong>Last Updated:</strong> January 1, 2025</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                1. Introduction
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  Welcome to MenuForest, a digital restaurant management platform operated by MenuForest Ltd., 
                  a company incorporated under the laws of the Republic of Rwanda, with its registered office 
                  located in Kigali, Rwanda.
                </p>
                <p>
                  These Terms and Conditions ("Terms") govern your use of the MenuForest platform, including 
                  our website, mobile applications, and related services (collectively, the "Service"). 
                  By accessing or using our Service, you agree to be bound by these Terms.
                </p>
                <p>
                  If you disagree with any part of these Terms, then you may not access the Service.
                </p>
              </div>
            </section>

            <Separator />

            {/* Definitions */}
            <section>
              <h2 className="text-xl font-semibold mb-4">2. Definitions</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p><strong>"Company"</strong> refers to MenuForest Ltd., registered in Rwanda.</p>
                <p><strong>"Service"</strong> refers to the MenuForest platform, including website, applications, and related services.</p>
                <p><strong>"User"</strong> or "You" refers to the individual or entity using our Service.</p>
                <p><strong>"Restaurant"</strong> refers to the food service establishment using our platform.</p>
                <p><strong>"Content"</strong> refers to text, images, data, and other materials uploaded to the platform.</p>
              </div>
            </section>

            <Separator />

            {/* Service Description */}
            <section>
              <h2 className="text-xl font-semibold mb-4">3. Service Description</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  MenuForest provides a comprehensive restaurant management platform that includes:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Digital menu creation and management</li>
                  <li>QR code generation for contactless ordering</li>
                  <li>Order management and tracking</li>
                  <li>Customer engagement tools</li>
                  <li>Analytics and reporting features</li>
                  <li>Payment processing integration</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of the Service 
                  at any time with reasonable notice to users.
                </p>
              </div>
            </section>

            <Separator />

            {/* Account Registration */}
            <section>
              <h2 className="text-xl font-semibold mb-4">4. Account Registration and Security</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  To use our Service, you must create an account by providing accurate, complete, 
                  and current information. You are responsible for:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your account information remains accurate and up-to-date</li>
                </ul>
                <p>
                  You must be at least 18 years old or the age of majority in Rwanda to create an account.
                </p>
              </div>
            </section>

            <Separator />

            {/* Subscription and Payment */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                5. Subscription and Payment Terms
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  MenuForest operates on a subscription-based model with the following terms:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Free Trial:</strong> New users receive a 14-day free trial with full access to features</li>
                  <li><strong>Subscription Plans:</strong> Various plans available with different features and pricing</li>
                  <li><strong>Payment Methods:</strong> We accept mobile money (MTN, Airtel), bank transfers, and cash payments</li>
                  <li><strong>Billing Cycle:</strong> Subscriptions are billed monthly or annually as selected</li>
                  <li><strong>Currency:</strong> All prices are quoted in Rwandan Francs (RWF) unless otherwise stated</li>
                </ul>
                <p>
                  <strong>Payment Processing:</strong> Payments are processed manually upon receipt. 
                  Your subscription will be activated within 24 hours of payment verification.
                </p>
                <p>
                  <strong>Refund Policy:</strong> Refunds are available within 7 days of payment for 
                  unused subscription periods, subject to our refund policy.
                </p>
              </div>
            </section>

            <Separator />

            {/* User Responsibilities */}
            <section>
              <h2 className="text-xl font-semibold mb-4">6. User Responsibilities and Prohibited Uses</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>You agree to use the Service responsibly and not to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Upload illegal, harmful, or offensive content</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Attempt to hack, disrupt, or damage the Service</li>
                  <li>Share your account credentials with unauthorized parties</li>
                  <li>Use the Service for fraudulent or deceptive purposes</li>
                  <li>Spam or harass other users</li>
                </ul>
                <p>
                  Violation of these terms may result in immediate suspension or termination of your account.
                </p>
              </div>
            </section>

            <Separator />

            {/* Data and Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                7. Data Protection and Privacy
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We are committed to protecting your privacy and personal data in accordance with 
                  Rwanda's data protection laws and international best practices.
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>We collect only necessary information to provide our services</li>
                  <li>Your data is stored securely and encrypted</li>
                  <li>We do not sell your personal information to third parties</li>
                  <li>You have the right to access, modify, or delete your data</li>
                  <li>Data processing complies with applicable privacy laws</li>
                </ul>
                <p>
                  For detailed information about our data practices, please refer to our Privacy Policy.
                </p>
              </div>
            </section>

            <Separator />

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold mb-4">8. Intellectual Property Rights</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>Our Rights:</strong> The MenuForest platform, including its design, features, 
                  and underlying technology, is owned by MenuForest Ltd. and protected by intellectual property laws.
                </p>
                <p>
                  <strong>Your Rights:</strong> You retain ownership of content you upload to the platform. 
                  By using our Service, you grant us a license to use, store, and display your content 
                  as necessary to provide the Service.
                </p>
                <p>
                  <strong>Restrictions:</strong> You may not copy, modify, distribute, or reverse engineer 
                  any part of our platform without written permission.
                </p>
              </div>
            </section>

            <Separator />

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                9. Limitation of Liability
              </h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  To the maximum extent permitted by law, MenuForest Ltd. shall not be liable for:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions or technical issues</li>
                  <li>Actions of third-party service providers</li>
                  <li>User-generated content or customer disputes</li>
                </ul>
                <p>
                  Our total liability shall not exceed the amount paid by you for the Service 
                  in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            <Separator />

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>By You:</strong> You may terminate your account at any time by contacting 
                  our support team or through your account settings.
                </p>
                <p>
                  <strong>By Us:</strong> We may suspend or terminate your account if you violate 
                  these Terms, fail to pay subscription fees, or for other legitimate business reasons.
                </p>
                <p>
                  <strong>Effect of Termination:</strong> Upon termination, your access to the Service 
                  will cease, and we may delete your data after a reasonable retention period.
                </p>
              </div>
            </section>

            <Separator />

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold mb-4">11. Governing Law and Jurisdiction</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  These Terms are governed by the laws of the Republic of Rwanda. Any disputes 
                  arising from these Terms or your use of the Service shall be subject to the 
                  exclusive jurisdiction of the courts of Rwanda.
                </p>
                <p>
                  We will make reasonable efforts to resolve disputes through good faith negotiations 
                  before resorting to formal legal proceedings.
                </p>
              </div>
            </section>

            <Separator />

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold mb-4">12. Changes to Terms</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of 
                  significant changes via email or through the platform at least 30 days before 
                  the changes take effect.
                </p>
                <p>
                  Continued use of the Service after changes become effective constitutes acceptance 
                  of the new Terms.
                </p>
              </div>
            </section>

            <Separator />

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold mb-4">13. Contact Information</h2>
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  If you have questions about these Terms or need support, please contact us:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>MenuForest Ltd.</strong></p>
                  <p>Kigali, Rwanda</p>
                  <p>Email: legal@menuforest.com</p>
                  <p>Support: support@menuforest.com</p>
                  <p>Phone: +250 788 123 456</p>
                  <p>WhatsApp: +250 788 123 456</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Acknowledgment */}
            <section className="bg-primary/5 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Acknowledgment</h2>
              <p className="text-sm leading-relaxed">
                By using MenuForest, you acknowledge that you have read, understood, and agree 
                to be bound by these Terms and Conditions. You also acknowledge that you have 
                read our Privacy Policy and consent to the collection and use of your information 
                as described therein.
              </p>
              <p className="text-sm leading-relaxed mt-3">
                <strong>Thank you for choosing MenuForest to grow your restaurant business!</strong>
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2025 MenuForest Ltd. All rights reserved.</p>
          <p>Registered in Rwanda | Empowering restaurants across Africa</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
