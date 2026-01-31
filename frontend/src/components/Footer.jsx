function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Government of India</h3>
                <p className="text-sm text-gray-300">Ministry of Social Justice & Empowerment</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Official portal for citizens to discover and apply for government welfare schemes.
              Powered by AI for efficient scheme matching and application guidance.
            </p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/profile" className="text-gray-300 hover:text-white transition-colors">User Profile Setup</a></li>
              <li><a href="/schemes" className="text-gray-300 hover:text-white transition-colors">Scheme Discovery</a></li>
              <li><a href="/documents" className="text-gray-300 hover:text-white transition-colors">Document Verification</a></li>
              <li><a href="/guidance" className="text-gray-300 hover:text-white transition-colors">Application Guidance</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Support</h4>
            <p className="text-gray-300 text-sm mb-2">
              Helpline: 1800-XXX-XXXX
            </p>
            <p className="text-gray-300 text-sm mb-2">
              Email: schemes@gov.in
            </p>
            <p className="text-gray-300 text-sm">
              Working Hours: Mon-Fri, 9AM-6PM
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 Government of India. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white text-sm">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
