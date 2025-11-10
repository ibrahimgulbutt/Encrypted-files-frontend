import React from 'react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="block">Zero-Knowledge</span>
              <span className="block text-blue-600 dark:text-blue-400">
                Encrypted Storage
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300 mb-8">
              Your files are encrypted on your device before upload. 
              We never see your data. Complete privacy guaranteed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="/login"
                className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-medium border border-gray-300 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Complete Privacy by Design
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your data is encrypted before it leaves your device
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Client-Side Encryption
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All files are encrypted on your device using AES-256 before upload. 
                Only you have the keys.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Zero-Knowledge
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We never see your files or passwords. Even we cannot access 
                your data if we wanted to.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Password Recovery
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Forgot your password? Your files are gone forever. 
                This proves we cannot access your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Upload File
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select files from your device
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Encrypt Locally
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Files encrypted on your device
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Store Securely
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Only encrypted data reaches our servers
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Download & Decrypt
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Decrypt on your device only
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to secure your files?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who trust us with their most sensitive data
          </p>
          <a
            href="/register"
            className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Start Encrypting Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Encrypted Storage</h3>
            <p className="text-gray-400 mb-4">
              Zero-knowledge encrypted cloud storage
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/security" className="hover:text-white">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}