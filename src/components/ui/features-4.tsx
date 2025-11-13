import { QrCode, MessageSquare, Zap, Smartphone, BarChart3, Shield } from 'lucide-react';

export function Features() {
    return (
        <section id="features" className="py-12 md:py-20 bg-white dark:bg-gray-900">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl text-gray-900 dark:text-white">Why Choose MenuForest?</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">Everything you need to create professional digital menus that customers love and restaurants trust.</p>
                </div>

                <div className="relative mx-auto grid max-w-2xl lg:max-w-4xl divide-x divide-y border border-gray-200 dark:border-gray-700 dark:divide-gray-700 *:p-12 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <QrCode className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Instant QR Codes</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Generate unique QR codes for each table. Customers scan and see your menu instantly without any app downloads.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp Orders</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Customers order directly via WhatsApp with pre-filled messages. Seamless ordering experience for everyone.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Lightning Fast</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Set up your entire menu in minutes. Beautiful, mobile-optimized design out of the box.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Smartphone className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Mobile Optimized</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Perfect responsive design that works flawlessly on all devices. Your menu looks great everywhere.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Analytics & Insights</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Track menu performance, popular items, and customer behavior to optimize your restaurant operations.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4 text-gray-600 dark:text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Secure & Reliable</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Enterprise-grade security with 99.9% uptime. Your menu is always available when customers need it.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
