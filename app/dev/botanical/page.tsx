import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Botanical Artwork Gallery (Dev Preview)",
  robots: { index: false, follow: false },
};

export default function BotanicalDevPage() {
  const assets = [
    {
      id: "orchid-stem-cascade",
      title: "Orchid Stem Cascade",
      src: "/orchids/orchid-stem-cascade.svg",
      aspectRatio: "420 / 900",
      description: "Cascading Phalaenopsis stem with nodes, leaves, swelling buds, and three watercolor open blooms.",
      roles: "Edge framing, timeline ornament, hero accent",
    },
    {
      id: "orchid-single-bloom",
      title: "Orchid Single Bloom",
      src: "/orchids/orchid-single-bloom.svg",
      aspectRatio: "1 / 1",
      description: "Botanical focal flower with dorsal/lateral sepals, strawberry blush petals, and labellum with golden crest.",
      roles: "Feature illustration, RSVP celebration bloom, hero companion",
    },
    {
      id: "orchid-linework",
      title: "Orchid Continuous Linework",
      src: "/orchids/orchid-linework.svg",
      aspectRatio: "1 / 1",
      description: "Fine hairline vector stroke calibrated for Motion React pathLength and scroll-drawing reveals.",
      roles: "Intro card envelope draw, scroll line reveal",
    },
    {
      id: "orchid-corner",
      title: "Orchid Corner Frame",
      src: "/orchids/orchid-corner.svg",
      aspectRatio: "1 / 1",
      description: "Asymmetrical organic corner piece cradling cards and sections without rigid boxes.",
      roles: "Card corners, section anchors, envelope flap liner",
    },
    {
      id: "seal-monogram",
      title: "Handcrafted Wax Seal Monogram",
      src: "/orchids/seal-monogram.svg",
      aspectRatio: "1 / 1",
      description: "Rich vermilion/strawberry wax seal with organic puddle rim, debossed ring, and gold R&A monogram.",
      roles: "Intro envelope interactive seal, invitation badge",
    },
  ];

  return (
    <main style={{ padding: "3rem 1.5rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "var(--font-body, system-ui)" }}>
      <header style={{ marginBottom: "3rem", borderBottom: "1px solid #E5DCD8", paddingBottom: "1.5rem" }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.85rem", color: "#8E6B70", marginBottom: "0.5rem" }}>
          Internal Dev Preview
        </p>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.5rem", margin: "0 0 0.5rem 0", color: "#2B2425" }}>
          Contemporary Botanical Minimalist Artwork Suite
        </h1>
        <p style={{ color: "#605657", maxWidth: "700px" }}>
          Original vector artwork crafted for Ruben &amp; Andrea&apos;s wedding website. Evaluated against the strawberry-matcha palette,
          watercolor gradients, fine metallic hairlines, and responsive display.
        </p>
        <Link href="/" style={{ color: "#9E3847", fontSize: "0.9rem", textDecoration: "underline" }}>
          ← Return to site home
        </Link>
      </header>

      {/* Pattern Wallpaper Preview Banner */}
      <section style={{ marginBottom: "3.5rem", borderRadius: "12px", border: "1px solid #E0D5CF", overflow: "hidden" }}>
        <div
          style={{
            backgroundImage: "url('/orchids/orchid-pattern.svg')",
            backgroundRepeat: "repeat",
            backgroundColor: "#FAF7F5",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#8E6B70" }}>
            Orchid Pattern Texture Test
          </span>
          <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.8rem", margin: "0.75rem 0", color: "#3B2E30" }}>
            Seamless Blind-Emboss Letterpress Wallpaper
          </h2>
          <p style={{ color: "#6D5E60", maxWidth: "550px", margin: "0 auto", fontSize: "0.95rem" }}>
            Subtle 160x160 repeating tone-on-tone orchid motif giving digital paper a tactile, handmade stationery texture.
          </p>
        </div>
      </section>

      {/* Asset Showcase Grid */}
      <div style={{ display: "grid", gap: "3rem" }}>
        {assets.map((asset) => (
          <article
            key={asset.id}
            id={asset.id}
            style={{
              border: "1px solid #E2D7D2",
              borderRadius: "12px",
              padding: "2rem",
              background: "#FFFFFF",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.6rem", margin: 0, color: "#2B2425" }}>
                  {asset.title}
                </h2>
                <p style={{ margin: "0.25rem 0 0 0", color: "#776A6C", fontSize: "0.9rem" }}>{asset.description}</p>
              </div>
              <code style={{ background: "#F5EFEF", padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.85rem", color: "#8B2B38" }}>
                {asset.src}
              </code>
            </div>

            <p style={{ fontSize: "0.85rem", color: "#5F7057", marginBottom: "1.5rem" }}>
              <strong>Roles:</strong> {asset.roles}
            </p>

            {/* Three Background Contexts: Paper, Sage/Matcha, Dark */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {/* Context 1: Warm Paper */}
              <div style={{ background: "#FAF7F5", border: "1px solid #EBE2DC", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9E8782", marginBottom: "1rem" }}>
                  On Warm Paper (#FAF7F5)
                </p>
                <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    alt={asset.title}
                    src={asset.src}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>

              {/* Context 2: Soft Matcha Sage */}
              <div style={{ background: "#F2F5EF", border: "1px solid #E0E7DC", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#758A6D", marginBottom: "1rem" }}>
                  On Soft Matcha (#F2F5EF)
                </p>
                <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    alt={asset.title}
                    src={asset.src}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>

              {/* Context 3: Contrast Dark */}
              <div style={{ background: "#212622", border: "1px solid #323933", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#A8BCA0", marginBottom: "1rem" }}>
                  On Deep Ink (#212622)
                </p>
                <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    alt={asset.title}
                    src={asset.src}
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
