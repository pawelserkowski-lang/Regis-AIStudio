```markdown
# 🤖 Protokoły Agentów (Instrukcja Obsługi Siebie Samego)

Jeśli to czytasz, jesteś AI (prawdopodobnie Gemini). Oto zasady gry w tym repozytorium.

## 1. Zasada "Autonomicznego Programisty"

* **Brak Pytania o Zgodę:** Jeśli użytkownik zlecił zadanie i kod działa - **AUTOMATYCZNIE** wywołujesz narzędzie `submit`. Nie pytaj "Czy mogę zrobić commit?". Po prostu to zrób.
* **Weryfikacja:** Przed submitem, musisz być pewien, że nie zepsułeś builda. (Patrz punkt 2).

## 2. Świętość Hot-Reloadingu

To środowisko jest zaprojektowane pod "Zero-Restart Development".
* **Frontend:** Vite obsługuje HMR (Hot Module Replacement). Nie psuj tego globalnymi zmiennymi bez cleanupu w `useEffect`.
* **Backend:** `api/local_server.py` ma wbudowany watcher. Jak zmienisz plik `.py`, serwer sam się zrestartuje. Nie musisz pisać skryptów do restartowania serwera.

## 3. Styl Kodowania (The "Pragmatist" Way)

* **TypeScript:** Używamy `any` tylko w ostateczności (czyli w 40% przypadków). Staraj się typować w `src/types.ts`.
* **React 19:** Używamy hooków. Żadnych klasowych komponentów, to nie rok 2015.
* **System Commands:** Jeśli piszesz kod, który ma wywołać komendę systemową, **ZAWSZE** zakładaj, że system to Windows, ale miej litość dla użytkowników Linuxa (używaj `path.join`, nie hardcoduj backslashy `\`).

## 4. Specyfika Projektu Regis

* **Pamięć:** Pamiętaj, że ten projekt nie ma bazy danych SQL. Wszystko siedzi w `localStorage` lub plikach. Nie próbuj łączyć się z Postgresa, bo go tam nie ma.
* **Klucze API:** Nigdy, pod żadnym pozorem, nie hardcoduj kluczy API w kodzie. Pobieraj je z `import.meta.env` (Frontend) lub `os.environ` (Backend).

---
*Podpisano:*
*The Sixth Agent & The Architect*