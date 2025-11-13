import { Link } from 'react-router-dom';

// Import generic icons from lucide-react
import {
    Globe, // Could represent a website or general online presence
    Share2, // Could represent sharing/social media in general
    MessageCircle, // Could represent communication/social
    Link as LinkIcon, // Renamed to avoid conflict with React Router Link
    Send, // Could represent sending a message, a bit like a paper plane for social
    Feather, // Could be an abstract representation for a 'feed' or 'post'
} from 'lucide-react';

const links = [
    {
        title: 'Features',
        href: '#features',
    },
    {
        title: 'Pricing',
        href: '/pricing',
    },
    {
        title: 'Demo',
        href: '/menu/demo-restaurant/table1',
    },
    {
        title: 'Support',
        href: '#contact',
    },
    {
        title: 'About',
        href: '#about',
    },
    {
        title: 'Contact',
        href: '#contact',
    },
];

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-32 bg-black dark:bg-gray-950">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    to="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <span className="font-bold text-2xl bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                        MenuForest
                    </span>
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            to={link.href}
                            className="text-gray-400 hover:text-white block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>
                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {/* Using generic icons for social links */}
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 1" // Generic label
                        className="text-gray-400 hover:text-white block">
                        <Share2 className="size-6" /> {/* Generic "Share" icon */}
                    </a>
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 2"
                        className="text-gray-400 hover:text-white block">
                        <MessageCircle className="size-6" /> {/* Generic "Message" icon */}
                    </a>
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 3"
                        className="text-gray-400 hover:text-white block">
                        <LinkIcon className="size-6" /> {/* Generic "Link" icon */}
                    </a>
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 4"
                        className="text-gray-400 hover:text-white block">
                        <Globe className="size-6" /> {/* Generic "Globe" (website/world) icon */}
                    </a>
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 5"
                        className="text-gray-400 hover:text-white block">
                        <Send className="size-6" /> {/* Generic "Send" icon */}
                    </a>
                    <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Social Link 6"
                        className="text-gray-400 hover:text-white block">
                        <Feather className="size-6" /> {/* Generic "Feather" (post/write) icon */}
                    </a>
                </div>
                <span className="text-gray-400 block text-center text-sm">
                    © {new Date().getFullYear()} MenuForest. Making restaurant dining better, one scan at a time.
                </span>
            </div>
        </footer>
    );
}
