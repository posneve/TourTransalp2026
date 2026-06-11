import { NavLink } from 'react-router-dom';
import { STAGES } from '../../data/stages';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <NavLink to="/" className={styles.brand}>
        🏔 Tour Transalp 2026
      </NavLink>
      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : '')}>
          Overview
        </NavLink>
        {STAGES.map((s) => (
          <NavLink
            key={s.id}
            to={`/stage/${s.id}`}
            className={({ isActive }) => (isActive ? styles.active : '')}
          >
            S{s.id}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
