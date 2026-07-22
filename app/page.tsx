export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        backgroundColor: "#f5f5f5",
        color: "#222",
      }}
    >
      <h1>🏡 Our Family Headquarters</h1>

      <p>Your family's command center.</p>

      <button
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Enter Dashboard
      </button>
    </main>
  );
}