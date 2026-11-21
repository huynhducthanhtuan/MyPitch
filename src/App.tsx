import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Edit3,
  Goal,
  MapPin,
  Menu,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import {
  deleteMatch,
  getDataMode,
  getMatches,
  saveMatch,
  type MatchDraft,
  type MatchRecord,
  type MatchStatus,
} from "./matchService";
import "./App.css";

const currentYear = new Date().getFullYear();
const today = (() => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();
const monthLabels = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const monthNames = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

type Outcome = "win" | "draw" | "loss";

function outcomeOf(match: MatchRecord): Outcome | null {
  if (
    match.status !== "played" ||
    match.teamScore === null ||
    match.opponentScore === null
  )
    return null;
  if (match.teamScore > match.opponentScore) return "win";
  if (match.teamScore < match.opponentScore) return "loss";
  return "draw";
}

function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" },
) {
  return new Intl.DateTimeFormat("vi-VN", options).format(
    new Date(`${date}T00:00:00`),
  );
}

function emptyStats() {
  return {
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals: 0,
    assists: 0,
    minutes: 0,
  };
}

function App() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MatchRecord | null>(null);
  const [formStatus, setFormStatus] = useState<MatchStatus>("scheduled");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadMatches = async () => {
    setLoading(true);
    setError("");
    try {
      setMatches(await getMatches());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải dữ liệu trận đấu.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getMatches()
      .then((loadedMatches) => {
        if (active) setMatches(loadedMatches);
      })
      .catch((loadError: unknown) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu trận đấu.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const yearMatches = useMemo(
    () =>
      matches.filter(
        (match) => new Date(`${match.date}T00:00:00`).getFullYear() === year,
      ),
    [matches, year],
  );
  const playedMatches = useMemo(
    () => yearMatches.filter((match) => match.status === "played"),
    [yearMatches],
  );
  const stats = useMemo(() => {
    const result = emptyStats();
    for (const match of playedMatches) {
      result.matches += 1;
      result.goals += match.goals;
      result.assists += match.assists;
      result.minutes += match.minutes;
      const outcome = outcomeOf(match);
      if (outcome === "win") result.wins += 1;
      if (outcome === "draw") result.draws += 1;
      if (outcome === "loss") result.losses += 1;
    }
    return result;
  }, [playedMatches]);

  const monthlyStats = useMemo(
    () =>
      monthLabels.map((_, month) => {
        const games = playedMatches.filter(
          (match) => new Date(`${match.date}T00:00:00`).getMonth() === month,
        );
        return games.reduce((monthly, match) => {
          monthly.matches += 1;
          monthly.goals += match.goals;
          monthly.assists += match.assists;
          const outcome = outcomeOf(match);
          if (outcome === "win") monthly.wins += 1;
          if (outcome === "draw") monthly.draws += 1;
          if (outcome === "loss") monthly.losses += 1;
          return monthly;
        }, emptyStats());
      }),
    [playedMatches],
  );
  const maxMonthlyGoals = Math.max(
    1,
    ...monthlyStats.map((month) => month.goals),
  );
  const monthStats =
    selectedMonth === null ? null : monthlyStats[selectedMonth];
  const visibleMatches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    return yearMatches
      .filter(
        (match) =>
          selectedMonth === null ||
          new Date(`${match.date}T00:00:00`).getMonth() === selectedMonth,
      )
      .filter(
        (match) =>
          !term ||
          `${match.opponent} ${match.venue} ${match.competition}`
            .toLocaleLowerCase("vi")
            .includes(term),
      )
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
      );
  }, [query, selectedMonth, yearMatches]);

  const years = Array.from(
    new Set([
      currentYear,
      ...matches.map((match) =>
        new Date(`${match.date}T00:00:00`).getFullYear(),
      ),
    ]),
  ).sort((a, b) => b - a);

  const openNewMatch = () => {
    setEditing(null);
    setFormStatus("scheduled");
    setModalOpen(true);
  };

  const openEditMatch = (match: MatchRecord) => {
    setEditing(match);
    setFormStatus(match.status);
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const readNumber = (field: string, fallback = 0) => {
      const value = String(formData.get(field) ?? "").trim();
      return value === "" ? fallback : Number(value);
    };
    const teamScore = formData.get("teamScore");
    const opponentScore = formData.get("opponentScore");
    const draft: MatchDraft = {
      opponent: String(formData.get("opponent") ?? "").trim(),
      competition: String(formData.get("competition") ?? "").trim(),
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      venue: String(formData.get("venue") ?? "").trim(),
      status: formStatus,
      teamScore: formStatus === "played" ? Number(teamScore) : null,
      opponentScore: formStatus === "played" ? Number(opponentScore) : null,
      goals: readNumber("goals"),
      assists: readNumber("assists"),
      minutes: readNumber("minutes"),
    };

    if (
      formStatus === "played" &&
      (teamScore === "" ||
        opponentScore === "" ||
        teamScore === null ||
        opponentScore === null)
    ) {
      setError("Vui lòng nhập tỷ số hai đội cho trận đã kết thúc.");
      return;
    }
    if (
      [
        draft.goals,
        draft.assists,
        draft.minutes,
        draft.teamScore,
        draft.opponentScore,
      ].some(
        (value) => value !== null && (!Number.isInteger(value) || value < 0),
      )
    ) {
      setError("Các chỉ số và tỷ số phải là số nguyên không âm.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const saved = await saveMatch(draft, editing?.id);
      setMatches((previous) =>
        editing
          ? previous.map((match) => (match.id === saved.id ? saved : match))
          : [...previous, saved],
      );
      setModalOpen(false);
      setEditing(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu trận đấu.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (match: MatchRecord) => {
    if (!match.id || !window.confirm(`Xóa trận đấu với ${match.opponent}?`))
      return;
    setError("");
    try {
      await deleteMatch(match.id);
      setMatches((previous) => previous.filter((item) => item.id !== match.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa trận đấu.",
      );
    }
  };

  const winRate = stats.matches
    ? Math.round((stats.wins / stats.matches) * 100)
    : 0;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="#overview"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="brand-mark">
            <Activity size={21} strokeWidth={2.6} />
          </span>
          <span className="brand-copy">
            <strong>
              my<span>pitch</span>
            </strong>
            <small>PLAYER JOURNAL</small>
          </span>
        </a>

        <div className="nav-caption">KHÔNG GIAN CỦA BẠN</div>
        <nav className="side-nav" aria-label="Điều hướng chính">
          <a
            className="nav-link active"
            href="#overview"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Activity size={18} /> Tổng quan
          </a>
          <a
            className="nav-link"
            href="#matches"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CalendarDays size={18} /> Lịch thi đấu
          </a>
          <a
            className="nav-link"
            href="#performance"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Trophy size={18} /> Thống kê
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="season-card">
            <div className="season-icon">
              <Shield size={18} />
            </div>
            <div>
              <span>MÙA GIẢI</span>
              <strong>{year} season</strong>
            </div>
            <ChevronDown size={15} />
          </div>
          <div className="player-profile">
            <div className="profile-avatar">ME</div>
            <div className="profile-copy">
              <strong>Cầu thủ của bạn</strong>
              <span>Hồ sơ cá nhân</span>
            </div>
            <button
              type="button"
              className="icon-button profile-menu"
              aria-label="Thông tin hồ sơ"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu-button"
            aria-label="Mở menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <span>Không gian của bạn</span>
            <span className="crumb-slash">/</span>
            <strong>Tổng quan</strong>
          </div>
          <div className="topbar-actions">
            <label className="year-select-wrap">
              <span className="sr-only">Chọn năm</span>
              <CalendarDays size={16} />
              <select
                value={year}
                onChange={(event) => {
                  setYear(Number(event.target.value));
                  setSelectedMonth(null);
                }}
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              type="button"
              className="button button-primary top-add"
              onClick={openNewMatch}
            >
              <Plus size={17} /> Thêm trận đấu
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {getDataMode() === "local" && (
            <div className="connection-banner">
              <span className="connection-dot" />
              Đang ở chế độ xem trước — dữ liệu lưu trên trình duyệt này.
              <span>
                Thêm <code>VITE_MOCKAPI_URL</code> để đồng bộ với MockAPI.
              </span>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              <CircleHelp size={18} />
              <span>{error}</span>
              <button
                type="button"
                className="text-button"
                onClick={() => void loadMatches()}
              >
                Thử lại
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Đóng thông báo"
                onClick={() => setError("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> MÙA GIẢI {year}
              </div>
              <h1>
                Hành trình của <em>bạn.</em>
              </h1>
              <p className="welcome-subtitle">
                Mỗi trận đấu là một dấu mốc. Cùng nhìn lại màn trình diễn của
                bạn trong năm nay.
              </p>
            </div>
            <div className="welcome-note">
              <Sparkles size={16} />
              <span>
                Thống kê được cập nhật
                <br />
                <strong>sau từng trận đấu</strong>
              </span>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Chỉ số trong năm">
            <article className="metric-card metric-primary">
              <div className="metric-top">
                <span>SỐ TRẬN ĐÃ ĐẤU</span>
                <span className="metric-icon">
                  <Swords size={17} />
                </span>
              </div>
              <div className="metric-value">
                {loading ? "—" : stats.matches}
                <span className="metric-unit">trận</span>
              </div>
              <div className="metric-foot">
                <span className="metric-dot" /> Trong năm {year}
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>BÀN THẮNG</span>
                <span className="metric-icon mint">
                  <Goal size={17} />
                </span>
              </div>
              <div className="metric-value">
                {loading ? "—" : stats.goals}
                <span className="metric-unit">bàn</span>
              </div>
              <div className="metric-foot">
                <span className="metric-highlight">
                  Trung bình{" "}
                  {stats.matches
                    ? (stats.goals / stats.matches).toFixed(1)
                    : "0.0"}
                </span>{" "}
                bàn / trận
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>KIẾN TẠO</span>
                <span className="metric-icon orange">
                  <Sparkles size={17} />
                </span>
              </div>
              <div className="metric-value">
                {loading ? "—" : stats.assists}
                <span className="metric-unit">lần</span>
              </div>
              <div className="metric-foot">
                <span className="metric-highlight">
                  {stats.assists + stats.goals}
                </span>{" "}
                đóng góp bàn thắng
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-top">
                <span>PHÚT THI ĐẤU</span>
                <span className="metric-icon blue">
                  <Clock3 size={17} />
                </span>
              </div>
              <div className="metric-value">
                {loading ? "—" : stats.minutes.toLocaleString("vi-VN")}
                <span className="metric-unit">phút</span>
              </div>
              <div className="metric-foot">
                <span className="metric-highlight">
                  {stats.matches
                    ? Math.round(stats.minutes / stats.matches)
                    : 0}
                </span>{" "}
                phút / trận
              </div>
            </article>
          </section>

          <section className="dashboard-grid" id="performance">
            <article className="panel performance-panel">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">PHONG ĐỘ CỦA BẠN</div>
                  <h2>Nhịp điệu mùa giải</h2>
                </div>
                <button
                  type="button"
                  className={`select-pill ${selectedMonth === null ? "selected" : ""}`}
                  onClick={() => setSelectedMonth(null)}
                >
                  Cả năm <ChevronDown size={14} />
                </button>
              </div>
              <div className="chart-summary">
                <div>
                  <strong>{monthStats ? monthStats.goals : stats.goals}</strong>
                  <span>BÀN THẮNG</span>
                </div>
                <div className="summary-separator" />
                <div>
                  <strong>
                    {monthStats ? monthStats.matches : stats.matches}
                  </strong>
                  <span>TRẬN ĐÃ ĐẤU</span>
                </div>
                <div className="chart-legend">
                  <span /> Bàn thắng
                </div>
              </div>
              <div
                className="bar-chart"
                role="group"
                aria-label="Bàn thắng theo tháng"
              >
                {monthlyStats.map((month, index) => {
                  const height = month.goals
                    ? Math.max(12, (month.goals / maxMonthlyGoals) * 100)
                    : 4;
                  return (
                    <button
                      type="button"
                      key={monthLabels[index]}
                      className={`chart-column ${selectedMonth === index ? "chart-selected" : ""}`}
                      onClick={() =>
                        setSelectedMonth(selectedMonth === index ? null : index)
                      }
                      aria-label={`${monthNames[index]}: ${month.goals} bàn, ${month.matches} trận`}
                      aria-pressed={selectedMonth === index}
                    >
                      <span className="bar-count">{month.goals || ""}</span>
                      <span
                        className={`bar-track ${month.goals ? "" : "bar-empty"}`}
                      >
                        <span
                          className="bar-fill"
                          style={{ height: `${height}%` }}
                        />
                      </span>
                      <span className="bar-label">{monthLabels[index]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="chart-footnote">
                <span>
                  <span className="footnote-dot" /> Tháng có trận đấu sẽ tự động
                  được ghi nhận
                </span>
                <span>{year}</span>
              </div>
            </article>

            <article className="panel record-panel">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">KẾT QUẢ TẬP THỂ</div>
                  <h2>Bảng thành tích</h2>
                </div>
                <span className="record-year">{year}</span>
              </div>
              <div className="record-score">
                <div className="win-stat">
                  <strong>{loading ? "—" : stats.wins}</strong>
                  <span>Thắng</span>
                </div>
                <div className="record-divider" />
                <div className="draw-stat">
                  <strong>{loading ? "—" : stats.draws}</strong>
                  <span>Hòa</span>
                </div>
                <div className="record-divider" />
                <div className="loss-stat">
                  <strong>{loading ? "—" : stats.losses}</strong>
                  <span>Thua</span>
                </div>
              </div>
              <div className="winrate-box">
                <div className="winrate-label">
                  <span>TỶ LỆ CHIẾN THẮNG</span>
                  <strong>{winRate}%</strong>
                </div>
                <div className="winrate-track">
                  <span style={{ width: `${winRate}%` }} />
                </div>
              </div>
              <div className="record-message">
                <div className="record-message-icon">
                  <Trophy size={17} />
                </div>
                <span>
                  {stats.matches ? (
                    <>
                      Bạn đã góp mặt trong{" "}
                      <strong>{stats.matches} trận đấu</strong> năm nay.
                    </>
                  ) : (
                    <>Bắt đầu ghi lại trận đấu đầu tiên của bạn.</>
                  )}
                </span>
              </div>
            </article>
          </section>

          <section className="matches-section" id="matches">
            <div className="matches-heading">
              <div>
                <div className="section-kicker">NHẬT KÝ SÂN CỎ</div>
                <h2>
                  Lịch thi đấu & kết quả{" "}
                  <span className="match-count">{visibleMatches.length}</span>
                </h2>
              </div>
              <div className="match-tools">
                <label className="search-field">
                  <Search size={16} />
                  <span className="sr-only">Tìm trận đấu</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm đối thủ, sân đấu..."
                  />
                </label>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={openNewMatch}
                >
                  <Plus size={16} /> Thêm trận
                </button>
              </div>
            </div>
            <div className="table-card">
              {loading ? (
                <div className="empty-state">
                  <span className="loading-spinner" /> Đang tải dữ liệu trận
                  đấu...
                </div>
              ) : visibleMatches.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <CalendarDays size={22} />
                  </div>
                  <strong>
                    {query || selectedMonth !== null
                      ? "Không tìm thấy trận đấu"
                      : "Chưa có trận đấu nào"}
                  </strong>
                  <span>
                    {query || selectedMonth !== null
                      ? "Thử từ khóa khác hoặc chọn xem cả năm."
                      : "Thêm lịch đấu để bắt đầu theo dõi hành trình của bạn."}
                  </span>
                  {!query && selectedMonth === null && (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={openNewMatch}
                    >
                      <Plus size={16} /> Thêm trận đấu đầu tiên
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>NGÀY & GIỜ</th>
                        <th>ĐỐI THỦ</th>
                        <th>SÂN / GIẢI ĐẤU</th>
                        <th>KẾT QUẢ</th>
                        <th>CHỈ SỐ CÁ NHÂN</th>
                        <th>TRẠNG THÁI</th>
                        <th>
                          <span className="sr-only">Thao tác</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMatches.map((match) => {
                        const outcome = outcomeOf(match);
                        return (
                          <tr key={match.id}>
                            <td>
                              <div className="date-cell">
                                <strong>{formatDate(match.date)}</strong>
                                <span>{match.time}</span>
                              </div>
                            </td>
                            <td>
                              <div className="opponent-cell">
                                <span className="opponent-badge">
                                  {match.opponent
                                    .slice(0, 1)
                                    .toLocaleUpperCase("vi")}
                                </span>
                                <div>
                                  <strong>{match.opponent}</strong>
                                  <span>{match.competition || "Giao hữu"}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="venue-cell">
                                <MapPin size={14} />
                                <span>{match.venue || "Chưa cập nhật"}</span>
                              </div>
                            </td>
                            <td>
                              {match.status === "played" ? (
                                <div className="score-cell">
                                  <strong>
                                    {match.teamScore} - {match.opponentScore}
                                  </strong>
                                  <span className={`outcome-text ${outcome}`}>
                                    {outcome === "win"
                                      ? "Thắng"
                                      : outcome === "draw"
                                        ? "Hòa"
                                        : "Thua"}
                                  </span>
                                </div>
                              ) : (
                                <span className="score-pending">—</span>
                              )}
                            </td>
                            <td>
                              <div className="personal-stats">
                                <span>
                                  <Goal size={13} /> {match.goals}
                                </span>
                                <span>
                                  <Sparkles size={13} /> {match.assists}
                                </span>
                                <span>
                                  <Clock3 size={13} /> {match.minutes}&apos;
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${match.status}`}>
                                {match.status === "played" ? (
                                  <>
                                    <Check size={12} /> Đã kết thúc
                                  </>
                                ) : (
                                  <>
                                    <span className="status-dot" /> Sắp diễn ra
                                  </>
                                )}
                              </span>
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="icon-button"
                                  aria-label={`Sửa trận với ${match.opponent}`}
                                  onClick={() => openEditMatch(match)}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-button delete-action"
                                  aria-label={`Xóa trận với ${match.opponent}`}
                                  onClick={() => void handleDelete(match)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="table-caption">
              <span>
                <span className="caption-dot" /> Tỷ số hiển thị theo góc nhìn
                đội của bạn
              </span>
              <span>Cập nhật thủ công sau trận đấu</span>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              MY PITCH <span className="footer-separator">/</span> THE STORY IS
              YOURS
            </span>
            <span>Ghi lại từng khoảnh khắc trên sân.</span>
          </footer>
        </div>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="match-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <div className="section-kicker">
                  {editing ? "CẬP NHẬT THÔNG TIN" : "GHI LẠI MỘT DẤU MỐC"}
                </div>
                <h2 id="modal-title">
                  {editing ? "Chỉnh sửa trận đấu" : "Thêm trận đấu"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Đóng"
                onClick={() => setModalOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <form
              key={editing?.id ?? "new-match"}
              onSubmit={(event) => void handleSave(event)}
            >
              <div className="form-grid">
                <label className="form-field form-full">
                  <span>
                    Đối thủ <b>*</b>
                  </span>
                  <input
                    name="opponent"
                    required
                    placeholder="VD: FC Riverside"
                    defaultValue={editing?.opponent ?? ""}
                    autoFocus
                  />
                </label>
                <label className="form-field">
                  <span>
                    Ngày thi đấu <b>*</b>
                  </span>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={editing?.date ?? today}
                  />
                </label>
                <label className="form-field">
                  <span>
                    Thời gian <b>*</b>
                  </span>
                  <input
                    name="time"
                    type="time"
                    required
                    defaultValue={editing?.time ?? "18:00"}
                  />
                </label>
                <label className="form-field">
                  <span>Sân vận động</span>
                  <input
                    name="venue"
                    placeholder="Tên sân"
                    defaultValue={editing?.venue ?? ""}
                  />
                </label>
                <label className="form-field">
                  <span>Giải đấu</span>
                  <input
                    name="competition"
                    placeholder="VD: Giải phong trào"
                    defaultValue={editing?.competition ?? ""}
                  />
                </label>
              </div>
              <div className="status-choice">
                <span>Trạng thái trận đấu</span>
                <div role="group" aria-label="Trạng thái trận đấu">
                  <button
                    type="button"
                    className={
                      formStatus === "scheduled" ? "choice-active" : ""
                    }
                    onClick={() => setFormStatus("scheduled")}
                  >
                    <CalendarDays size={14} /> Sắp diễn ra
                  </button>
                  <button
                    type="button"
                    className={formStatus === "played" ? "choice-active" : ""}
                    onClick={() => setFormStatus("played")}
                  >
                    <Check size={14} /> Đã kết thúc
                  </button>
                </div>
              </div>
              {formStatus === "played" && (
                <div className="result-fields">
                  <div className="result-fields-title">
                    <span>TỶ SỐ TRẬN ĐẤU</span>
                    <span>
                      Đội của bạn <ArrowUpRight size={13} /> Đối thủ
                    </span>
                  </div>
                  <div className="score-inputs">
                    <input
                      name="teamScore"
                      type="number"
                      min="0"
                      step="1"
                      required
                      aria-label="Bàn thắng đội của bạn"
                      placeholder="0"
                      defaultValue={editing?.teamScore ?? ""}
                    />
                    <span>—</span>
                    <input
                      name="opponentScore"
                      type="number"
                      min="0"
                      step="1"
                      required
                      aria-label="Bàn thắng đối thủ"
                      placeholder="0"
                      defaultValue={editing?.opponentScore ?? ""}
                    />
                  </div>
                  <div className="form-grid personal-inputs">
                    <label className="form-field">
                      <span>Bàn thắng cá nhân</span>
                      <input
                        name="goals"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={editing?.goals ?? 0}
                      />
                    </label>
                    <label className="form-field">
                      <span>Kiến tạo</span>
                      <input
                        name="assists"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={editing?.assists ?? 0}
                      />
                    </label>
                    <label className="form-field form-full">
                      <span>Số phút thi đấu</span>
                      <input
                        name="minutes"
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        defaultValue={editing?.minutes ?? 0}
                      />
                    </label>
                  </div>
                </div>
              )}
              {formStatus === "scheduled" && (
                <div className="scheduled-hint">
                  <Clock3 size={15} /> Sau trận đấu, chọn “Đã kết thúc” để cập
                  nhật tỷ số và chỉ số cá nhân.
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check size={16} />{" "}
                      {editing ? "Lưu thay đổi" : "Lưu trận đấu"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
