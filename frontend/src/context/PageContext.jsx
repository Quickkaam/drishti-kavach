import React, { createContext, useContext, useState, useCallback } from 'react';

const PageContext = createContext();

export const usePageContext = () => {
  return useContext(PageContext);
};

export const PageProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageData, setPageData] = useState({});

  const setPageContext = useCallback((pageName, data = {}) => {
    setCurrentPage(pageName);
    setPageData(data);
  }, []);

  const value = {
    currentPage,
    pageData,
    setPageContext
  };

  return (
    <PageContext.Provider value={value}>
      {children}
    </PageContext.Provider>
  );
};
