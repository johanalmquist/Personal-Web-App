import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../contexts/auth-context";

type FormState = "default" | "loading" | "error";

const LAST_EMAIL_KEY = "lastEmail";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>("default");
  const [errorMessage, setErrorMessage] = useState("Invalid email or password");

  useEffect(() => {
    const saved = localStorage.getItem(LAST_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState("loading");
    localStorage.setItem(LAST_EMAIL_KEY, email);

    const { error } = await signIn(email, password);
    if (error) {
      setFormState("error");
      setErrorMessage(error.message || "Invalid email or password");
      setPassword("");
    }
    // On success: auth state change will update session; routing handled in JOH-25
  }

  const isLoading = formState === "loading";
  const isError = formState === "error";

  return (
    <div style={styles.page}>
      {/* Background dot grid via inline style — using ::before equivalent */}
      <div style={styles.dotGrid} />

      {/* Ambient glow orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* Left panel — mini app preview */}
      <div style={styles.leftPanel}>
        <div style={styles.previewTitle}>Your finances, at a glance</div>
        <div style={styles.previewStack}>
          {/* Remaining stat card */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative preview card with cosmetic hover */}
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: decorative preview card with cosmetic hover */}
          <div
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "0.65";
            }}
            style={styles.prevCard}
          >
            <div style={styles.prevCardLabel}>Remaining · March 2026</div>
            <div
              style={{ ...styles.prevCardValue, color: "var(--accent-soft)" }}
            >
              21 786 kr
            </div>
            <div style={styles.prevCardBar}>
              <div
                style={{
                  ...styles.prevCardFill,
                  width: "86%",
                  background: "var(--accent)",
                }}
              />
            </div>
            <div style={styles.prevCardMeta}>
              86% of variable room left · 6 days remaining
            </div>
          </div>

          {/* Recent transactions card */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative preview card with cosmetic hover */}
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: decorative preview card with cosmetic hover */}
          <div
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.opacity = "0.65";
            }}
            style={{ ...styles.prevCard, paddingBottom: "10px" }}
          >
            <div style={styles.prevCardLabel}>Recent transactions</div>
            <PrevTx
              amount="− 450"
              amountColor="var(--red)"
              icon="🛒"
              name="ICA Maxi"
            />
            <PrevTx
              amount="− 848"
              amountColor="var(--red)"
              icon="💪"
              name="Gym"
            />
            <PrevTx
              amount="+ 45 000"
              amountColor="var(--green)"
              icon="💰"
              isLast
              name="Lön mars"
            />
          </div>
        </div>
      </div>

      {/* Center — login card */}
      <div style={styles.loginWrap}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandMark}>J</div>
          <div style={styles.brandName}>Johan's Finance</div>
          <div style={styles.brandSub}>Personal budget &amp; cash book</div>
        </div>

        {/* Card */}
        <div style={styles.loginCard}>
          <div style={styles.cardTitle}>Sign in</div>
          <div style={styles.cardSub}>
            Enter your credentials to access your account
          </div>

          <form noValidate onSubmit={handleSubmit}>
            {/* Error banner */}
            {isError && (
              <div style={styles.errorBanner}>
                <svg
                  aria-hidden="true"
                  style={styles.errorBannerIcon}
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <div>
                  <div style={styles.errorBannerText}>{errorMessage}</div>
                  <div style={styles.errorBannerSub}>
                    Please check your credentials and try again.
                  </div>
                </div>
              </div>
            )}

            {/* Email field */}
            <div style={styles.formField}>
              <label htmlFor="login-email" style={styles.fieldLabel}>
                Email address
              </label>
              <div style={styles.fieldInputWrap}>
                <div
                  style={{
                    ...styles.fieldIcon,
                    ...(isError ? styles.fieldIconError : {}),
                  }}
                >
                  <svg
                    aria-hidden="true"
                    style={styles.fieldIconSvg}
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <input
                  autoComplete="email"
                  id="login-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  readOnly={isLoading}
                  required
                  style={{
                    ...styles.fieldInput,
                    ...(isError ? styles.fieldInputError : {}),
                    ...(email ? styles.fieldInputHasValue : {}),
                  }}
                  type="email"
                  value={email}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={styles.formField}>
              <label htmlFor="login-password" style={styles.fieldLabel}>
                Password
              </label>
              <div style={styles.fieldInputWrap}>
                <div
                  style={{
                    ...styles.fieldIcon,
                    ...(isError ? styles.fieldIconError : {}),
                  }}
                >
                  <svg
                    aria-hidden="true"
                    style={styles.fieldIconSvg}
                    viewBox="0 0 24 24"
                  >
                    <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  autoComplete="current-password"
                  id="login-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  readOnly={isLoading}
                  required
                  style={{
                    ...styles.fieldInput,
                    paddingRight: "42px",
                    ...(isError ? styles.fieldInputError : {}),
                  }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.pwToggle}
                  tabIndex={-1}
                  type="button"
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      style={styles.fieldIconSvg}
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" x2="23" y1="1" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      style={styles.fieldIconSvg}
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {isError && (
                <div style={styles.fieldError}>
                  <svg
                    aria-hidden="true"
                    style={styles.fieldErrorIcon}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" x2="9" y1="9" y2="15" />
                    <line x1="9" x2="15" y1="9" y2="15" />
                  </svg>
                  Password is incorrect
                </div>
              )}
            </div>

            {/* Forgot password */}
            <div style={styles.forgotRow}>
              <span style={styles.forgotLink}>Forgot password?</span>
            </div>

            {/* Submit button */}
            <button
              disabled={isLoading}
              style={{
                ...styles.submitBtn,
                ...(isLoading ? styles.submitBtnLoading : {}),
              }}
              type="submit"
            >
              {isLoading ? (
                <>
                  <span style={styles.spinner} />
                  Signing in…
                </>
              ) : (
                <>
                  {isError ? "Try again" : "Sign in"}
                  <svg
                    aria-hidden="true"
                    style={styles.submitBtnIcon}
                    viewBox="0 0 24 24"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Private badge */}
        <div style={styles.privateBadge}>
          <div style={styles.privateBadgeDot} />
          <span style={styles.privateBadgeText}>
            Private application · Access by invitation only
          </span>
        </div>
      </div>

      {/* Right panel — feature highlights */}
      <div style={styles.rightPanel}>
        <div style={{ ...styles.previewTitle, textAlign: "left" }}>
          What&apos;s inside
        </div>

        <FeatItem
          icon="📊"
          iconBg="rgba(66,99,235,0.12)"
          sub="Snapshot budgets with category breakdown and variance tracking"
          title="Monthly budget tracking"
        />
        <FeatItem
          icon="🧾"
          iconBg="rgba(255,107,107,0.11)"
          sub="Full cash book with running balance, tags, and receipt uploads"
          title="Transaction log"
        />
        <FeatItem
          icon="⏰"
          iconBg="rgba(252,196,25,0.10)"
          sub="Plan future income and expenses months in advance"
          title="Pre-registered entries"
        />
        <FeatItem
          icon="📤"
          iconBg="rgba(81,207,102,0.11)"
          sub="Export any date range to .xlsx in your familiar format"
          title="Excel export"
        />
        <FeatItem
          icon="📱"
          iconBg="rgba(204,93,232,0.10)"
          sub="Add to home screen on iOS and Android for offline access"
          title="Installable PWA"
        />
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PrevTx({
  icon,
  name,
  amount,
  amountColor,
  isLast,
}: {
  icon: string;
  name: string;
  amount: string;
  amountColor: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.prevTx,
        ...(isLast ? { borderBottom: "none", paddingBottom: 0 } : {}),
      }}
    >
      <div
        style={{
          ...styles.prevTxIcon,
          background:
            amountColor === "var(--red)"
              ? "rgba(255,107,107,0.11)"
              : "rgba(81,207,102,0.11)",
        }}
      >
        {icon}
      </div>
      <span style={styles.prevTxName}>{name}</span>
      <span style={{ ...styles.prevTxAmt, color: amountColor }}>{amount}</span>
    </div>
  );
}

function FeatItem({
  iconBg,
  icon,
  title,
  sub,
}: {
  iconBg: string;
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div style={styles.featItem}>
      <div style={{ ...styles.featIcon, background: iconBg }}>{icon}</div>
      <div>
        <div style={styles.featTitle}>{title}</div>
        <div style={styles.featSub}>{sub}</div>
      </div>
    </div>
  );
}

/* ── Styles ── */

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "1fr 480px 1fr",
    alignItems: "center",
    justifyItems: "center",
    minHeight: "100vh",
    padding: "32px 24px",
    position: "relative" as const,
    overflow: "hidden",
    background: "var(--bg)",
  },

  dotGrid: {
    position: "absolute" as const,
    inset: 0,
    backgroundImage:
      "radial-gradient(circle, var(--border) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
    opacity: 0.4,
    zIndex: 0,
    pointerEvents: "none" as const,
  },

  orb: {
    position: "absolute" as const,
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none" as const,
    zIndex: 0,
  },
  orb1: {
    width: "480px",
    height: "480px",
    background:
      "radial-gradient(circle, rgba(66,99,235,.18) 0%, transparent 70%)",
    top: "-100px",
    left: "-80px",
  },
  orb2: {
    width: "400px",
    height: "400px",
    background:
      "radial-gradient(circle, rgba(112,72,232,.12) 0%, transparent 70%)",
    bottom: "-60px",
    right: "40px",
  },
  orb3: {
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(81,207,102,.07) 0%, transparent 70%)",
    top: "40%",
    left: "55%",
  },

  /* Left panel */
  leftPanel: {
    gridColumn: "1",
    zIndex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    paddingRight: "40px",
    gap: "20px",
    width: "100%",
    maxWidth: "380px",
    justifySelf: "end" as const,
  },

  previewTitle: {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    color: "var(--text-3)",
    marginBottom: "4px",
    textAlign: "right" as const,
  },

  previewStack: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    width: "100%",
  },

  prevCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: "14px 16px",
    opacity: 0.65,
    transition: "opacity 0.3s",
  },

  prevCardLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.7px",
    color: "var(--text-3)",
    marginBottom: "4px",
  },

  prevCardValue: {
    fontSize: "20px",
    fontWeight: 900,
    letterSpacing: "-0.7px",
    fontVariantNumeric: "tabular-nums",
  },

  prevCardBar: {
    height: "4px",
    background: "var(--border)",
    borderRadius: "2px",
    marginTop: "8px",
    overflow: "hidden",
  },

  prevCardFill: {
    height: "100%",
    borderRadius: "2px",
  },

  prevCardMeta: {
    fontSize: "10px",
    color: "var(--text-3)",
    marginTop: "4px",
  },

  prevTx: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    borderBottom: "1px solid var(--border)",
  },

  prevTxIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    flexShrink: 0,
  },

  prevTxName: {
    fontSize: "12px",
    fontWeight: 600,
    flex: 1,
  },

  prevTxAmt: {
    fontSize: "12px",
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums" as const,
  },

  /* Center — login wrap */
  loginWrap: {
    gridColumn: "2",
    zIndex: 2,
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },

  brand: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "10px",
    marginBottom: "28px",
  },

  brandMark: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "var(--accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-1px",
    boxShadow: "0 8px 32px var(--accent-glow)",
  },

  brandName: {
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    color: "var(--text)",
  },

  brandSub: {
    fontSize: "12px",
    color: "var(--text-3)",
    marginTop: "-6px",
  },

  loginCard: {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-2xl)",
    padding: "32px",
    boxShadow: "0 24px 64px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.03)",
  },

  cardTitle: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    marginBottom: "4px",
  },

  cardSub: {
    fontSize: "13px",
    color: "var(--text-3)",
    marginBottom: "28px",
  },

  /* Form */
  formField: {
    marginBottom: "16px",
  },

  fieldLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--text-2)",
    marginBottom: "6px",
    letterSpacing: "0.1px",
  },

  fieldInputWrap: {
    position: "relative" as const,
  },

  fieldIcon: {
    position: "absolute" as const,
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-3)",
    pointerEvents: "none" as const,
    display: "flex",
    alignItems: "center",
  },

  fieldIconError: {
    color: "var(--red)",
  },

  fieldIconSvg: {
    width: "15px",
    height: "15px",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  },

  fieldInput: {
    width: "100%",
    height: "44px",
    background: "var(--surface-raised)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--r-md)",
    color: "var(--text)",
    fontSize: "14px",
    padding: "0 12px 0 38px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },

  fieldInputHasValue: {
    borderColor: "var(--border)",
  },

  fieldInputError: {
    borderColor: "var(--red)",
  },

  fieldError: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    color: "var(--red)",
    marginTop: "5px",
    fontWeight: 600,
  },

  fieldErrorIcon: {
    width: "11px",
    height: "11px",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round" as const,
    flexShrink: 0,
  },

  pwToggle: {
    position: "absolute" as const,
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    padding: 0,
    transition: "color 0.12s",
  },

  forgotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: "22px",
    marginTop: "-8px",
  },

  forgotLink: {
    fontSize: "12px",
    color: "var(--accent-soft)",
    cursor: "pointer",
    fontWeight: 600,
  },

  submitBtn: {
    width: "100%",
    height: "46px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--r-md)",
    fontSize: "15px",
    fontWeight: 800,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "-0.2px",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 16px rgba(66,99,235,.4)",
  },

  submitBtnLoading: {
    opacity: 0.75,
    pointerEvents: "none" as const,
  },

  submitBtnIcon: {
    width: "16px",
    height: "16px",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  },

  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },

  /* Error banner */
  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "var(--red-bg)",
    border: "1px solid rgba(255,107,107,.25)",
    borderRadius: "var(--r-md)",
    padding: "12px 14px",
    marginBottom: "20px",
  },

  errorBannerIcon: {
    width: "15px",
    height: "15px",
    fill: "none",
    stroke: "var(--red)",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    flexShrink: 0,
    marginTop: "1px",
  },

  errorBannerText: {
    fontSize: "13px",
    color: "var(--red)",
    fontWeight: 600,
    lineHeight: 1.4,
  },

  errorBannerSub: {
    fontSize: "11px",
    color: "var(--red)",
    opacity: 0.7,
    marginTop: "2px",
  },

  /* Private badge */
  privateBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-pill)",
    padding: "5px 12px 5px 8px",
    marginTop: "20px",
  },

  privateBadgeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "var(--green)",
    boxShadow: "0 0 6px var(--green)",
    flexShrink: 0,
    animation: "pulse 2s ease-in-out infinite",
  },

  privateBadgeText: {
    fontSize: "11px",
    color: "var(--text-3)",
    fontWeight: 600,
    letterSpacing: "0.2px",
  },

  /* Right panel */
  rightPanel: {
    gridColumn: "3",
    zIndex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    paddingLeft: "40px",
    width: "100%",
    maxWidth: "340px",
    justifySelf: "start" as const,
    opacity: 0.7,
  },

  featItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },

  featIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "var(--r-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },

  featTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--text)",
  },

  featSub: {
    fontSize: "12px",
    color: "var(--text-3)",
    marginTop: "1px",
  },
} as const;
