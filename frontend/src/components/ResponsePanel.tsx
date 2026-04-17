interface ResponsePanelProps {
  lastResponse: unknown;
  lastError: string;
}

export function ResponsePanel({ lastResponse, lastError }: ResponsePanelProps) {
  return (
    <section className="response-panel">
      <h3>请求-响应面板</h3>
      {lastError ? <p className="error-line">{lastError}</p> : null}
      <pre>{JSON.stringify(lastResponse ?? { message: "暂无执行记录" }, null, 2)}</pre>
    </section>
  );
}
