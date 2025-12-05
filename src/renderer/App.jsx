import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/reader/:abbreviation" element={<ReaderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </FluentProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
