import { Pill, MapPin, Phone, Mail, Clock } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-100 bg-emerald-950 text-emerald-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Pill className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">Taj Medicals</span>
            </div>
            <p className="mt-3 text-sm text-emerald-200">
              Your trusted neighborhood pharmacy — quality medicines, wellness products, and
              personalized care.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-200">
              <li>
                <a href="#products" className="hover:text-white">
                  Products
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white">
                  Services
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-200">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Beside Praveen Hardware, Arya Nagar,
                Koradi Naka, Nagpur
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 9869782706
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> hellotajmedicals@gmail.com
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Hours</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-200">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Mon–Sat: 9:30am–10:30pm
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Sun: 9:30am–2pm, 6–9pm
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-emerald-800 pt-6 text-xs text-emerald-300 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Taj Medicals. All rights reserved.</p>
          <p>Licensed pharmacy • Est. 2020</p>
        </div>
      </div>
    </footer>
  );
}
