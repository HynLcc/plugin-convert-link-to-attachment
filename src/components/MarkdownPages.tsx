import { useTranslation } from "react-i18next";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useContext } from "react";
import { EvnContext } from "./context/EnvProvider";
import { useInitApi } from "@/hooks/useInitApi";

export const MarkdownPages = () => {
  const { t } = useTranslation();
  const { tableId } = useContext(EvnContext);
  const isInit = useInitApi();

  if (!tableId || !isInit) {
    return <div>No tableId</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <MarkdownRenderer tableId={tableId} />
    </div>
  );
};
