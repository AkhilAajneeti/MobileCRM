import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import HelpSidebar from "./components/HelpSidebar";
import HelpHome from "./components/HelpHome";
import CategoryView from "./components/CategoryView";
import ArticleView from "./components/ArticleView";
import Icon from "../../components/AppIcon";
import { getCategory, getArticle } from "./content";
import { BRAND, BRAND_SOFT } from "./theme";

const NotFoundBlock = ({ title, message }) => (
  <div className="max-w-xl py-12 text-center mx-auto">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
      style={{ background: BRAND_SOFT, color: BRAND }}
    >
      <Icon name="SearchX" size={26} />
    </div>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500 mt-1.5">{message}</p>
  </div>
);

const HelpPage = () => {
  const { categoryId, articleId } = useParams();
  const [isAppSidebarOpen, setIsAppSidebarOpen] = useState(false);

  let content;
  let pageTitle = "Help Center";

  if (articleId && categoryId) {
    const article = getArticle(categoryId, articleId);
    if (article) {
      pageTitle = `${article.title} · Help`;
      content = <ArticleView article={article} categoryId={categoryId} />;
    } else {
      content = (
        <NotFoundBlock
          title="Article not found"
          message="The guide you're looking for might have been moved or renamed. Try the categories on the left."
        />
      );
    }
  } else if (categoryId) {
    const category = getCategory(categoryId);
    if (category) {
      pageTitle = `${category.name} · Help`;
      content = <CategoryView category={category} />;
    } else {
      content = (
        <NotFoundBlock
          title="Category not found"
          message="That category doesn't exist. Pick one from the sidebar to browse guides."
        />
      );
    }
  } else {
    content = <HelpHome />;
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="CRM Help Center — short, beginner-friendly guides for leads, meetings, tasks, reports and more."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header
          onMenuToggle={() => setIsAppSidebarOpen((v) => !v)}
          isSidebarOpen={isAppSidebarOpen}
        />
        <Sidebar
          isOpen={isAppSidebarOpen}
          onClose={() => setIsAppSidebarOpen(false)}
        />

        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <HelpSidebar />
              <div className="flex-1 min-w-0">{content}</div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default HelpPage;
