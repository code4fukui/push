# PUSH かんたんオープンデータ

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

A simple open data platform that allows anyone to register a dataset, generate a unique URL, and update it anytime.

- **Demo:** [https://push.sabae.cc/](https://push.sabae.cc/)

## Features

- **Simple Web UI:** Register and update data through an easy-to-use web form. No database required.
- **Shareable URLs:** Each dataset gets a unique, persistent URL.
- **Flexible Data Types:** Use predefined types like `facility`, `store`, and `event`, or create your own custom types using the `generic` schema.
- **Data Aggregation:** Combine multiple datasets into a single endpoint using the `container` type.
- **Multiple Formats:** Access data as a human-readable HTML page, or in machine-readable JSON and CSV formats.

## How to Use

### 1. Register Data
- Go to the [demo site](https://push.sabae.cc/).
- Select an existing data type (e.g., [施設/facility](https://push.sabae.cc/#type=facility), [店舗/store](https://push.sabae.cc/#type=store)) or create a new one by starting with [種別/generic](https://push.sabae.cc/#type=generic).
- Fill in the form and click "オープンデータ登録" (Register Open Data).
- A unique ID and a `パスコード` (passcode) for future updates will be generated.

### 2. Aggregate Multiple Datasets
- Select the [集約/container](https://push.sabae.cc/#type=container) data type.
- In the `IDs` field, enter the numeric IDs of the datasets you want to bundle, separated by commas.
- Registering this will create a new container ID that provides a single endpoint for all included data.

## API Usage

Data can be accessed via simple GET requests.

- **Get HTML View:**
  - `https://push.sabae.cc/ID`
  - Renders a human-readable HTML page for one or more datasets.
  - Example: `https://push.sabae.cc/1`

- **Get JSON Data:**
  - `https://push.sabae.cc/ID1,ID2.json`
  - Returns aggregated data in JSON format. If an ID for a `container` is included, its contents are automatically fetched and included.
  - Example: `https://push.sabae.cc/1.json`

- **Get Raw JSON Data:**
  - `https://push.sabae.cc/ID.raw.json`
  - Returns the raw, unprocessed JSON file for a single dataset.

- **Get CSV Data:**
  - `https://push.sabae.cc/ID1,ID2.csv`
  - Returns aggregated data in CSV format.

- **List All Datasets:**
  - `https://push.sabae.cc/`
  - Returns a JSON array with metadata for all public datasets.

- **Register or Update Data:**
  - `POST /`
  - The web UI sends a JSON payload to this endpoint to create or update a dataset. To update, the correct `パスコード` must be included.

## Self-Hosting

### Requirements
- [Deno](https://deno.land/)

### Running the Server
1. Clone the repository.
2. Run the application server. The `run_push.sh` script includes a `while` loop to automatically restart the server if it crashes.
   ```sh
   sh run_push.sh
   ```
3. For production, you can run the server in the background using `nohup`:
   ```sh
   nohup sh run_push.sh &
   ```
The server will start on port 8006 by default. Data is stored as flat files in the `data/` directory.

## Article
- [PUSH型オープンデータでリアルタイムな情報発信！ 福井県コロナ情報サイトで活用開始 (Japanese)](https://fukuno.jig.jp/2849)

## License
This project is available under the [CC BY](https://creativecommons.org/licenses/by/4.0/) license.

---
Created by [@taisukef](https://twitter.com/taisukef) / [Code for FUKUI](https://github.com/code4fukui)