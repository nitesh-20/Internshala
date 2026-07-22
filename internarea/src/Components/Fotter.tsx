import { Facebook, Twitter, Instagram, Linkedin, Github, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Intern<span className="text-blue-500">Area</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {t("footer.empowering")}
            </p>
            <div className="flex space-x-4">
              <SocialIcon Icon={Linkedin} href="https://linkedin.com" />
              <SocialIcon Icon={Github} href="https://github.com/nitesh-20/Internshala" />
              <SocialIcon Icon={Twitter} href="#" />
              <SocialIcon Icon={Instagram} href="#" />
            </div>
          </div>

          <FooterSection 
            title={t("footer.opportunities")} 
            items={[
              { label: t("navbar.internships"), link: "/internship" },
              { label: t("navbar.jobs"), link: "/job" },
              { label: t("navbar.community"), link: "/community" },
              { label: t("navbar.resume_builder"), link: "/resume" },
              { label: t("navbar.premium"), link: "/subscription" }
            ]} 
          />
          <FooterSection 
            title={t("footer.resources")} 
            items={[
              { label: t("footer.faqs"), link: "#" },
              { label: t("footer.support_centre"), link: "#" },
              { label: t("footer.career_guidance"), link: "#" },
              { label: t("footer.success_stories"), link: "#" }
            ]} 
          />
          <FooterSection 
            title={t("footer.company")} 
            items={[
              { label: t("footer.about_us"), link: "#" },
              { label: t("footer.contact_us"), link: "#" },
              { label: t("footer.hiring"), link: "#" }
            ]} 
          />
          <FooterSection 
            title={t("footer.legal")} 
            items={[
              { label: t("footer.privacy_policy"), link: "#" },
              { label: t("footer.terms_of_service"), link: "#" },
              { label: t("footer.cookie_policy"), link: "#" }
            ]} 
          />
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            {t("footer.all_rights_reserved", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              <Mail size={16} /> {t("footer.contact_support")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({ title, items }: { title: string, items: {label: string, link: string}[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">{title}</h3>
      <ul className="flex flex-col space-y-3">
        {items.map((item, index) => (
          <li key={index}>
            <Link href={item.link} className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ Icon, href }: { Icon: any, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300 hover:-translate-y-1">
      <Icon size={18} />
    </a>
  );
}