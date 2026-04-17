import { useCallback } from "react";
import { createApi } from "../api";
import type { ApiTraceSource } from "../types";
import { useAppSession } from "./app-session";

export function useApiFactory(source: ApiTraceSource) {
  const { recordTrace } = useAppSession();

  const makeApi = useCallback(
    (tokenProvider: () => string) =>
      createApi(tokenProvider, {
        onRequest: (event) => {
          recordTrace(source, {
            method: event.method,
            path: event.path,
            requestBody: event.requestBody
          });
        },
        onResponse: (event) => {
          recordTrace(source, {
            method: event.method,
            path: event.path,
            requestBody: event.requestBody,
            responseBody: event.responseBody
          });
        },
        onError: (event) => {
          recordTrace(source, {
            method: event.method,
            path: event.path,
            requestBody: event.requestBody,
            responseBody: event.responseBody,
            errorMessage: event.errorMessage
          });
        }
      }),
    [recordTrace, source]
  );

  return { makeApi };
}

