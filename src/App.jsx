import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';

// アプリケーションのテーマを定義
let darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#49fb60',
    },
    background: {
      default: '#000000',
      paper: '#121212',
    },
  },
});

// テーマオブジェクトを参照して、コンポーネントのスタイルを上書き
// これにより、色のハードコーディングをなくし、テーマとの連動性を高める
darkTheme = createTheme(darkTheme, {
  components: {
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          margin: 4, // スイッチ間の余白
        },
        switchBase: {
          padding: 0,
          margin: 2,
          transitionDuration: '300ms',
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              // テーマのprimaryカラーを参照
              backgroundColor: darkTheme.palette.primary.main,
              opacity: 1,
              border: 0,
            },
          },
        },
        thumb: {
          boxSizing: 'border-box',
          width: 22,
          height: 22,
          // OFFの時のつまみの色もテーマのprimaryカラーを参照
          color: '#205020',
        },
        track: {
          borderRadius: 26 / 2,
          backgroundColor: '#303030', // OFFの時のトラックの色を少し明るくして視認性を向上
          opacity: 1,
        },
      },
    },
  },
});

const TOGGLE_SIZE = 50; // 各トグルのサイズ (px) - 余白込み
const UPDATE_INTERVAL = 500; // 更新間隔 (ms)
const RANDOM_CHANCE = 0.1; // 状態が切り替わる確率

/**
 * トグルグリッドを表示・管理するコンポーネント
 */
function ToggleGrid() {
  const [toggles, setToggles] = useState([]);
  const [gridDims, setGridDims] = useState({ rows: 0, cols: 0 });

  /**
   * 画面サイズに基づいてグリッドを再計算し、状態を初期化する関数
   */
  const updateGrid = useCallback(() => {
    // 画面サイズよりさらに大きめのグリッドを計算して、左右も確実にはみ出させる
    const cols = Math.floor(window.innerWidth / TOGGLE_SIZE) + 4;
    const rows = Math.floor(window.innerHeight / TOGGLE_SIZE) + 4;

    // グリッドサイズが変わらない場合は何もしない
    if (cols === gridDims.cols && rows === gridDims.rows) return;

    setGridDims({ rows, cols });
    
    // トグルの状態を初期化 (すべてOFF)
    const newToggles = Array(rows).fill(null).map(() => Array(cols).fill(false));
    setToggles(newToggles);
  }, [gridDims.cols, gridDims.rows]);


  // コンポーネントのマウント時とウィンドウリサイズ時にグリッドを更新
  useEffect(() => {
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, [updateGrid]);

  // 一定時間ごとにランダムなスイッチの状態を更新
  useEffect(() => {
    const intervalId = setInterval(() => {
      setToggles(prevToggles => 
        prevToggles.map(row =>
          row.map(cell => 
            Math.random() < RANDOM_CHANCE ? !cell : cell
          )
        )
      );
    }, UPDATE_INTERVAL);

    // コンポーネントのアンマウント時にインターバルをクリア
    return () => clearInterval(intervalId);
  }, []); // 空の依存配列で、マウント時に一度だけ実行

  // ピンチアウトによるズームやスクロールを禁止する
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const preventDefault = (e) => e.preventDefault();
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.body.style.overflow = 'auto';
      document.body.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  // レンダリングするスイッチのリストをメモ化してパフォーマンスを最適化
  const switchElements = useMemo(() => {
    return toggles.flat().map((isChecked, index) => (
      <Switch
        key={index}
        checked={isChecked}
        readOnly // ユーザー操作はさせず、自動更新のみ
      />
    ));
  }, [toggles]);

  return (
    // 1. 画面ピッタリの表示領域コンテナ (はみ出した部分を隠す)
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'black',
      }}
    >
      {/* 2. 画面より大きいグリッドコンテナ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridDims.cols}, ${TOGGLE_SIZE}px)`,
          gridTemplateRows: `repeat(${gridDims.rows}, ${TOGGLE_SIZE}px)`,
          position: 'absolute',
          top: '50%',
          left: '50%',
          // X軸、Y軸ともに均等にずらして、四方が平等に欠けるように調整
          transform: 'translate(-52%, -52%)',
        }}
      >
        {switchElements}
      </Box>
    </Box>
  );
}

/**
 * アプリケーションのメインコンポーネント
 */
export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ToggleGrid />
    </ThemeProvider>
  );
}
