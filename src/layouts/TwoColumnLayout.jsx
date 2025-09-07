import React from "react";

export default function TwoColumnLayout({ sidebar, children }) {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 min-h-screen text-neutral-900">
      {/* 左カラム */}
      <aside className="md:col-span-3 border-b md:border-b-0 md:border-r border-neutral-200 bg-white p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex flex-wrap items-center">
            <img src="../images/icon.png" alt="アイコン" width="50px" height="50px" />
            <div className="flex items-center ml-2">ブルーロックPWC</div>
        </div>
        {sidebar}
      </aside>

      {/* 右カラム */}
      <main className="md:col-span-9 p-4 md:p-6 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
