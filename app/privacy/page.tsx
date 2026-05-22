export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen text-white px-6 py-12 max-w-2xl mx-auto"
      style={{ background: "linear-gradient(135deg, #060a06 0%, #080b08 50%, #060806 100%)" }}
    >
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-white/40 text-sm mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-semibold mb-2">1. Overview</h2>
          <p>
            This is a personal dashboard application used solely by its owner. It is not a public
            service and does not collect, store, or share data from any third party users.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">2. Pinterest Integration</h2>
          <p>
            This application connects to the Pinterest API solely to display the account owner's
            own boards and pins within their personal dashboard. No Pinterest data is shared with
            any third party. No Pinterest user data other than the account owner's is accessed.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">3. Data Storage</h2>
          <p>
            Any data stored by this application (including Pinterest board data) is stored
            securely and used exclusively for personal display purposes. Data is never sold,
            shared, or used for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">4. Cookies & Local Storage</h2>
          <p>
            This application uses browser local storage to save personal preferences and cached
            data. No tracking cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">5. Third Party Services</h2>
          <p>
            This application may connect to third party services (including Pinterest) using
            official APIs. Use of those services is governed by their respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold mb-2">6. Contact</h2>
          <p>
            For any questions about this privacy policy, contact the application owner at{" "}
            <a href="mailto:alekszpunt@icloud.com" className="text-green-400 hover:text-green-300">
              alekszpunt@icloud.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
