export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        [data-site-header], [data-site-footer] { display: none !important; }
        main { padding: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
