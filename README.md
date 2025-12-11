# 🔥 Regis AI Studio (Phoenix Edition)

**Wersja:** 2.0.0 (God Mode Enabled)
**Silnik:** React 19 + Python Serverless (udawany lokalnie)
**Napędzany przez:** Google Gemini 3 Pro & 2.5 Flash

Regis to nie jest zwykły chatbot. To zaawansowane środowisko typu SPA (Single Page Application), które pozwala modelowi Gemini nie tylko gadać, ale **wykonywać polecenia systemowe** na Twoim komputerze. Tak, dobrze przeczytałeś.

## 🌟 Co to potrafi? (Ficzery)

* **Tryb Boga (God Mode):** Model AI ma bezpośredni dostęp do Twojej konsoli CMD/Terminala. Widzi pliki, tworzy pliki, może (teoretycznie) usunąć system32, jeśli go ładnie poprosisz (nie rób tego).
* **Multimodalność:** Tekst, audio, obrazy. Wszystko mieli Gemini 3 Pro.
* **Live Mode:** Rozmowa głosowa w czasie rzeczywistym (WebRTC/WebSocket).
* **Architektura Zero-Build:** Frontend gada z AI bezpośrednio z przeglądarki, backend służy tylko do brudnej roboty (system operacyjny).
* **Samowystarczalność:** Baza wiedzy (Registry) zapisywana w `localStorage`. Twoje dane nie opuszczają przeglądarki (chyba że lecą do Google API).

## 🚀 Jak to odpalić (i przeżyć)?

### Wymagania
* **Node.js** (v18+ - bo React 19 tego wymaga)
* **Python 3.9+** (do backendu, który udaje serverless)
* **Klucz API Google Gemini** (niezbędny, inaczej to tylko ładny interfejs)

### Uruchamianie (Dla leniwych)

Mamy skrypt, który robi wszystko za Ciebie. Nawet chowa okna konsoli na Windowsie, żebyś czuł się jak haker.

**Windows:**
```cmd
python run.py