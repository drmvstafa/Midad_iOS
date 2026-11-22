import UIKit
import WebKit
import AVFoundation
import MediaPlayer
import UniformTypeIdentifiers
import PDFKit

final class MidadBridge: NSObject, WKScriptMessageHandler, UIDocumentPickerDelegate {
    weak var owner: MainWebViewController?

    private let httpSession: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.timeoutIntervalForRequest = 18
        cfg.timeoutIntervalForResource = 120
        cfg.httpAdditionalHeaders = [
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "Accept-Language": "ar,en-US;q=0.9,en;q=0.8"
        ]
        return URLSession(configuration: cfg)
    }()

    private var activeDownloads: [String: URLSessionDownloadTask] = [:]
    private let downloadsKey = "midad_ios_downloads_v1"
    private let localBooksKey = "midad_ios_local_books_v1"
    private var hapticsEnabled = true
    private var pendingPickerPurpose = "book" // "book" | "audio"

    // Native Audio Player State
    private var audioPlayer: AVPlayer?
    private var audioTimeObs: Any?
    private var audioState: [String: Any] = [:]
    private var sleepTimer: Timer?

    init(owner: MainWebViewController) {
        self.owner = owner
        super.init()
        setupRemoteAudioControls()
    }

    private var booksDir: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = docs.appendingPathComponent("MidadBooks", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    func bootstrapJavaScript() -> String {
        let dlJson = serializedStoredArray(forKey: downloadsKey)
        let localJson = serializedStoredArray(forKey: localBooksKey)
        let audioJson = jsonString(from: audioState) ?? "{}"
        let appVer = (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "1.4.0"

        return """
        (function(){
          window.__midadResp = window.__midadResp || {};
          window.__midadCache = {
            downloads: \(dlJson),
            localBooks: \(localJson),
            audioState: \(audioJson)
          };
          function post(fn, args){
            try {
              window.webkit.messageHandlers.midad.postMessage(Object.assign({ fn: fn }, args || {}));
            } catch(_) {}
          }
          window.Native = {
            _ios: true,
            version: function(){ return \(quoteJS(appVer)); },
            http: function(cbId, method, url, payload, headersJson){
              post('http', { cbId: cbId, method: method, url: url, payload: payload, headersJson: headersJson });
            },
            takeResp: function(id){
              var v = window.__midadResp[id];
              delete window.__midadResp[id];
              return typeof v === 'string' ? v : JSON.stringify(v || {});
            },
            clearCache: function(){ post('clearCache'); },
            downloadNative: function(jobJson){ post('downloadNative', { jobJson: jobJson }); },
            cancelDownload: function(id){ post('cancelDownload', { id: id }); },
            registerSavedDownload: function(jobJson){ post('registerSavedDownload', { jobJson: jobJson }); },
            removeDownload: function(id){ post('removeDownload', { id: id }); },
            getDownloads: function(){
              try { return JSON.stringify(window.__midadCache.downloads || []); } catch(_) { return '[]'; }
            },
            openInternalReader: function(uri, fileName, title){
              post('openInternalReader', { uri: uri, fileName: fileName, title: title });
              return true;
            },
            openBook: function(uri, fileName, title){
              post('openInternalReader', { uri: uri, fileName: fileName, title: title || fileName });
              return true;
            },
            openExternalReader: function(uri, fileName){
              post('openExternalReader', { uri: uri, fileName: fileName });
              return true;
            },
            pickLocalBook: function(){ post('pickLocalBook'); },
            pickBookFolder: function(){ post('pickLocalBook'); },
            scanDeviceBooks: function(){ post('scanDeviceBooks'); },
            getLocalBooks: function(){
              try { return JSON.stringify(window.__midadCache.localBooks || []); } catch(_) { return '[]'; }
            },
            removeLocalBook: function(uri){ post('removeLocalBook', { uri: uri }); },
            deleteBook: function(uri, dlId, fileName, sizeBytes, fromDevice){
              post('deleteBook', { uri: uri, dlId: dlId, fileName: fileName, sizeBytes: sizeBytes, fromDevice: fromDevice });
              return true;
            },
            hasStorageAccess: function(){ return true; },
            requestStorageAccess: function(){},
            openUrl: function(url){ post('openUrl', { url: url }); },
            openInstaPay: function(num, pUrl){ post('openInstaPay', { num: num, pUrl: pUrl }); },
            copy: function(txt){ post('copy', { txt: txt }); },
            toast: function(msg){},
            haptic: function(style){ post('haptic', { style: style }); },
            setHapticsEnabled: function(on){ post('setHapticsEnabled', { on: !!on }); },
            setSystemBars: function(bgHex, lightIcons){ post('setSystemBars', { bgHex: bgHex, lightIcons: !!lightIcons }); },
            has1DM: function(){ return ''; },
            send1DM: function(){ return false; },
            audioPlay: function(payloadJson){ post('audioPlay', { payloadJson: payloadJson }); },
            audioCommand: function(cmd, arg){ post('audioCommand', { cmd: cmd, arg: arg }); },
            audioGetState: function(){
              try { return JSON.stringify(window.__midadCache.audioState || {}); } catch(_) { return '{}'; }
            },
            pickAudioFile: function(){ post('pickAudioFile'); },
            requestNotificationPermission: function(){ return true; }
          };
        })();
        """
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let fn = body["fn"] as? String else { return }

        switch fn {
        case "http":
            handleHttp(body)
        case "clearCache":
            URLCache.shared.removeAllCachedResponses()
        case "downloadNative":
            if let raw = body["jobJson"] as? String { startDownload(jobJson: raw) }
        case "cancelDownload":
            if let id = body["id"] as? String { cancelDownload(id: id) }
        case "registerSavedDownload":
            if let raw = body["jobJson"] as? String { registerSavedDownload(jobJson: raw) }
        case "removeDownload":
            if let id = body["id"] as? String { removeDownload(id: id) }
        case "openInternalReader":
            let uri = body["uri"] as? String ?? ""
            let fileName = body["fileName"] as? String ?? "book.pdf"
            let title = body["title"] as? String ?? fileName
            openReader(uri: uri, fileName: fileName, title: title)
        case "openExternalReader":
            let uri = body["uri"] as? String ?? ""
            shareOrOpenExternal(uri: uri)
        case "pickLocalBook":
            presentPicker(purpose: "book")
        case "pickAudioFile":
            presentPicker(purpose: "audio")
        case "scanDeviceBooks":
            syncLocalFilesScan()
        case "removeLocalBook":
            if let uri = body["uri"] as? String { removeLocalBook(uri: uri) }
        case "deleteBook":
            let uri = body["uri"] as? String ?? ""
            let dlId = body["dlId"] as? String ?? ""
            deleteBookFiles(uri: uri, downloadId: dlId)
        case "openUrl":
            if let u = body["url"] as? String, let url = URL(string: u) {
                UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
        case "openInstaPay":
            let num = body["num"] as? String ?? "01027608911"
            UIPasteboard.general.string = num
            if let pUrl = body["pUrl"] as? String, let u = URL(string: pUrl) {
                UIApplication.shared.open(u, options: [:], completionHandler: nil)
            }
        case "copy":
            if let txt = body["txt"] as? String { UIPasteboard.general.string = txt }
        case "haptic":
            triggerHaptic(style: body["style"] as? String ?? "light")
        case "setHapticsEnabled":
            hapticsEnabled = (body["on"] as? Bool) ?? true
        case "setSystemBars":
            let hex = body["bgHex"] as? String ?? "#f7f1e3"
            let light = (body["lightIcons"] as? Bool) ?? true
            owner?.applySystemAppearance(hex: hex, lightIcons: light)
        case "audioPlay":
            if let raw = body["payloadJson"] as? String { handleAudioPlay(rawJson: raw) }
        case "audioCommand":
            let cmd = body["cmd"] as? String ?? ""
            let arg = body["arg"] as? String ?? ""
            handleAudioCommand(cmd: cmd, arg: arg)
        default:
            break
        }
    }

    // MARK: - HTTP Proxy (CORS-free via URLSession)
    private func handleHttp(_ args: [String: Any]) {
        let cbId = args["cbId"] as? String ?? ""
        let rawUrl = args["url"] as? String ?? ""
        let method = (args["method"] as? String ?? "GET").uppercased()
        let payload = args["payload"] as? String
        let headersJson = args["headersJson"] as? String

        let cleanUrlStr = rawUrl.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? rawUrl
        guard let url = URL(string: rawUrl) ?? URL(string: cleanUrlStr) else {
            deliverHttpResponse(cbId: cbId, result: ["code": 0, "error": "invalid_url", "body": ""])
            return
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        if let headersJson = headersJson, !headersJson.isEmpty,
           let hData = headersJson.data(using: .utf8),
           let hMap = try? JSONSerialization.jsonObject(with: hData) as? [String: Any] {
            for (k, v) in hMap {
                req.setValue("\(v)", forHTTPHeaderField: k)
            }
        }
        if let payload = payload, !payload.isEmpty, method != "GET", method != "HEAD" {
            req.httpBody = payload.data(using: .utf8)
        }

        httpSession.dataTask(with: req) { [weak self] data, resp, err in
            guard let self = self else { return }
            if let err = err {
                self.deliverHttpResponse(cbId: cbId, result: ["code": 0, "error": err.localizedDescription, "body": ""])
                return
            }
            let code = (resp as? HTTPURLResponse)?.statusCode ?? 200
            let finalUrl = resp?.url?.absoluteString ?? rawUrl
            let bodyStr = data.flatMap { String(data: $0, encoding: .utf8) ?? String(data: $0, encoding: .isoLatin1) } ?? ""
            self.deliverHttpResponse(cbId: cbId, result: ["code": code, "url": finalUrl, "body": bodyStr])
        }.resume()
    }

    private func deliverHttpResponse(cbId: String, result: [String: Any]) {
        guard let json = jsonString(from: result) else { return }
        owner?.evalJS("window.__midadResp[\(quoteJS(cbId))]=\(quoteJS(json));window.KTB&&window.KTB.cb&&window.KTB.cb(\(quoteJS(cbId)));")
    }

    // MARK: - Offline Book Downloads
    private func startDownload(jobJson: String) {
        guard let data = jobJson.data(using: .utf8),
              var job = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let urlStr = job["url"] as? String,
              let url = URL(string: urlStr) else { return }

        let id = (job["id"] as? String) ?? "dl_\(Int(Date().timeIntervalSince1970 * 1000))"
        let title = (job["title"] as? String) ?? "book"
        let fmt = ((job["format"] as? String) ?? "pdf").lowercased()
        let ext = fmt.isEmpty ? "pdf" : fmt
        let safeName = sanitizeFilename(title) + ".\(ext)"
        let dest = booksDir.appendingPathComponent(safeName)

        job["id"] = id
        job["status"] = "downloading"
        job["progress"] = 10
        job["fileName"] = safeName
        upsertStoredItem(job, key: downloadsKey)
        syncDownloadsCacheToJS()

        var req = URLRequest(url: url)
        if let ref = job["referer"] as? String, !ref.isEmpty {
            req.setValue(ref, forHTTPHeaderField: "Referer")
        }

        let task = httpSession.downloadTask(with: req) { [weak self] tmpUrl, resp, err in
            guard let self = self else { return }
            self.activeDownloads.removeValue(forKey: id)
            if let err = err {
                var failed = job
                failed["status"] = "failed"
                failed["error"] = err.localizedDescription
                self.upsertStoredItem(failed, key: self.downloadsKey)
                self.syncDownloadsCacheToJS()
                return
            }
            guard let tmpUrl = tmpUrl else { return }
            do {
                if FileManager.default.fileExists(atPath: dest.path) {
                    try FileManager.default.removeItem(at: dest)
                }
                try FileManager.default.moveItem(at: tmpUrl, to: dest)
                let attrs = try? FileManager.default.attributesOfItem(atPath: dest.path)
                let sizeBytes = (attrs?[.size] as? NSNumber)?.int64Value ?? 0

                var done = job
                done["status"] = "done"
                done["progress"] = 100
                done["uri"] = dest.absoluteString
                done["localUri"] = dest.absoluteString
                done["sizeBytes"] = sizeBytes
                if ext == "pdf", let pdfDoc = PDFDocument(url: dest) {
                    done["pages"] = pdfDoc.pageCount
                }
                self.upsertStoredItem(done, key: self.downloadsKey)
                self.syncDownloadsCacheToJS()
            } catch {
                var failed = job
                failed["status"] = "failed"
                failed["error"] = error.localizedDescription
                self.upsertStoredItem(failed, key: self.downloadsKey)
                self.syncDownloadsCacheToJS()
            }
        }
        activeDownloads[id] = task
        task.resume()
    }

    private func cancelDownload(id: String) {
        activeDownloads[id]?.cancel()
        activeDownloads.removeValue(forKey: id)
    }

    private func registerSavedDownload(jobJson: String) {
        guard let data = jobJson.data(using: .utf8),
              let job = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        upsertStoredItem(job, key: downloadsKey)
        syncDownloadsCacheToJS()
    }

    private func removeDownload(id: String) {
        cancelDownload(id: id)
        var arr = loadStoredArray(forKey: downloadsKey)
        arr.removeAll { ($0["id"] as? String) == id }
        saveStoredArray(arr, forKey: downloadsKey)
        syncDownloadsCacheToJS()
    }

    private func deleteBookFiles(uri: String, downloadId: String) {
        if !uri.isEmpty, let u = URL(string: uri), u.isFileURL {
            try? FileManager.default.removeItem(at: u)
        }
        if !downloadId.isEmpty { removeDownload(id: downloadId) }
        if !uri.isEmpty { removeLocalBook(uri: uri) }
    }

    private func removeLocalBook(uri: String) {
        var arr = loadStoredArray(forKey: localBooksKey)
        arr.removeAll { ($0["uri"] as? String) == uri }
        saveStoredArray(arr, forKey: localBooksKey)
        syncLocalCacheToJS()
    }

    private func syncLocalFilesScan() {
        let exts = Set(["pdf", "epub", "cbz", "txt", "html", "htm", "md"])
        let files = (try? FileManager.default.contentsOfDirectory(at: booksDir, includingPropertiesForKeys: [.fileSizeKey])) ?? []
        var existing = loadStoredArray(forKey: localBooksKey)
        for f in files where exts.contains(f.pathExtension.lowercased()) {
            let uri = f.absoluteString
            if !existing.contains(where: { ($0["uri"] as? String) == uri }) {
                existing.append([
                    "uri": uri,
                    "fileName": f.lastPathComponent,
                    "title": f.deletingPathExtension().lastPathComponent,
                    "format": f.pathExtension.lowercased(),
                    "addedAt": Int(Date().timeIntervalSince1970 * 1000)
                ])
            }
        }
        saveStoredArray(existing, forKey: localBooksKey)
        syncLocalCacheToJS()
    }

    // MARK: - Internal Native iOS Reader Launcher
    private func openReader(uri: String, fileName: String, title: String) {
        DispatchQueue.main.async {
            let readerVC = MidadReaderViewController(uriString: uri, fileName: fileName, bookTitle: title)
            readerVC.modalPresentationStyle = .fullScreen
            self.owner?.present(readerVC, animated: true)
        }
    }

    private func shareOrOpenExternal(uri: String) {
        DispatchQueue.main.async {
            guard let url = URL(string: uri) else { return }
            let ac = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            ac.popoverPresentationController?.sourceView = self.owner?.view
            self.owner?.present(ac, animated: true)
        }
    }

    // MARK: - UIDocumentPicker for Books & Audiobooks
    private func presentPicker(purpose: String) {
        pendingPickerPurpose = purpose
        DispatchQueue.main.async {
            let epubType = UTType(filenameExtension: "epub") ?? .data
            let types: [UTType] = purpose == "audio"
                ? [.audio, .mp3, .mpeg4Audio]
                : [.pdf, epubType, .plainText, .html, .data]
            let picker = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
            picker.delegate = self
            picker.allowsMultipleSelection = false
            self.owner?.present(picker, animated: true)
        }
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let src = urls.first else { return }
        let dest = booksDir.appendingPathComponent(src.lastPathComponent)
        do {
            if FileManager.default.fileExists(atPath: dest.path) {
                try FileManager.default.removeItem(at: dest)
            }
            try FileManager.default.copyItem(at: src, to: dest)
        } catch {
            NSLog("Copy picked file note: \(error.localizedDescription)")
        }
        let finalUrl = FileManager.default.fileExists(atPath: dest.path) ? dest : src
        if pendingPickerPurpose == "audio" {
            let payload: [String: Any] = [
                "uri": finalUrl.absoluteString,
                "fileName": finalUrl.lastPathComponent,
                "title": finalUrl.deletingPathExtension().lastPathComponent,
                "addedAt": Int(Date().timeIntervalSince1970 * 1000)
            ]
            if let js = jsonString(from: payload) {
                owner?.evalJS("window.KTB&&window.KTB.ev&&window.KTB.ev('pickedAudio',\(js));")
            }
        } else {
            let item: [String: Any] = [
                "uri": finalUrl.absoluteString,
                "fileName": finalUrl.lastPathComponent,
                "title": finalUrl.deletingPathExtension().lastPathComponent,
                "format": finalUrl.pathExtension.lowercased(),
                "addedAt": Int(Date().timeIntervalSince1970 * 1000)
            ]
            upsertStoredItem(item, key: localBooksKey, idField: "uri")
            syncLocalCacheToJS()
            openReader(uri: finalUrl.absoluteString, fileName: finalUrl.lastPathComponent, title: finalUrl.deletingPathExtension().lastPathComponent)
        }
    }

    // MARK: - Background Audiobook Player (AVPlayer + Lock Screen Controls)
    private func setupRemoteAudioControls() {
        let cc = MPRemoteCommandCenter.shared()
        cc.playCommand.addTarget { [weak self] _ in self?.handleAudioCommand(cmd: "toggle", arg: ""); return .success }
        cc.pauseCommand.addTarget { [weak self] _ in self?.handleAudioCommand(cmd: "pause", arg: ""); return .success }
        cc.skipForwardCommand.preferredIntervals = [15]
        cc.skipForwardCommand.addTarget { [weak self] _ in self?.handleAudioCommand(cmd: "delta", arg: "15000"); return .success }
        cc.skipBackwardCommand.preferredIntervals = [15]
        cc.skipBackwardCommand.addTarget { [weak self] _ in self?.handleAudioCommand(cmd: "delta", arg: "-15000"); return .success }
    }

    private func handleAudioPlay(rawJson: String) {
        guard let data = rawJson.data(using: .utf8),
              var obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
        let targetStr = (obj["localUri"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? (obj["srcUrl"] as? String ?? "")
        guard let url = URL(string: targetStr) else { return }

        DispatchQueue.main.async {
            if let obs = self.audioTimeObs {
                self.audioPlayer?.removeTimeObserver(obs)
                self.audioTimeObs = nil
            }
            let item = AVPlayerItem(url: url)
            let player = AVPlayer(playerItem: item)
            self.audioPlayer = player
            let spd = (obj["speed"] as? Double) ?? 1.0
            obj["isPlaying"] = true
            obj["isPreparing"] = false
            self.audioState = obj

            if let seekMs = obj["seekMs"] as? Double, seekMs > 0 {
                player.seek(to: CMTime(seconds: seekMs / 1000.0, preferredTimescale: 1000))
            }
            player.play()
            player.rate = Float(spd)
            self.updateNowPlaying()
            self.syncAudioCacheToJS()

            self.audioTimeObs = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1.0, preferredTimescale: 10), queue: .main) { [weak self] t in
                guard let self = self else { return }
                self.audioState["positionMs"] = Int(t.seconds * 1000)
                if let dur = player.currentItem?.duration.seconds, dur.isFinite && dur > 0 {
                    self.audioState["durationMs"] = Int(dur * 1000)
                }
                self.audioState["isPlaying"] = (player.rate > 0)
                self.updateNowPlaying()
                self.syncAudioCacheToJS()
            }
        }
    }

    private func handleAudioCommand(cmd: String, arg: String) {
        DispatchQueue.main.async {
            guard let player = self.audioPlayer else { return }
            switch cmd {
            case "toggle":
                if player.rate > 0 { player.pause(); self.audioState["isPlaying"] = false }
                else { player.play(); self.audioState["isPlaying"] = true }
            case "pause":
                player.pause(); self.audioState["isPlaying"] = false
            case "stop":
                player.pause(); player.seek(to: .zero)
                self.audioState["isPlaying"] = false; self.audioState["stopped"] = true; self.audioState["positionMs"] = 0
            case "seek":
                let ms = max(0, Double(arg) ?? 0)
                player.seek(to: CMTime(seconds: ms / 1000.0, preferredTimescale: 1000))
                self.audioState["positionMs"] = Int(ms)
            case "delta":
                let cur = player.currentTime().seconds * 1000.0
                let next = max(0, cur + (Double(arg) ?? 0))
                player.seek(to: CMTime(seconds: next / 1000.0, preferredTimescale: 1000))
                self.audioState["positionMs"] = Int(next)
            case "speed":
                let spd = max(0.5, min(2.5, Float(arg) ?? 1.0))
                self.audioState["speed"] = spd
                if player.rate > 0 { player.rate = spd }
            case "sleep":
                self.sleepTimer?.invalidate()
                let mins = Int(arg) ?? 0
                if mins > 0 {
                    self.audioState["sleepRemainingSec"] = mins * 60
                    self.sleepTimer = Timer.scheduledTimer(withTimeInterval: Double(mins * 60), repeats: false) { _ in
                        player.pause()
                        self.audioState["isPlaying"] = false
                        self.syncAudioCacheToJS()
                    }
                }
            default:
                break
            }
            self.updateNowPlaying()
            self.syncAudioCacheToJS()
        }
    }

    private func updateNowPlaying() {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: (audioState["title"] as? String) ?? "مداد",
            MPMediaItemPropertyArtist: (audioState["author"] as? String) ?? "",
            MPNowPlayingInfoPropertyPlaybackRate: (audioPlayer?.rate ?? 0)
        ]
        if let pos = audioState["positionMs"] as? Int {
            info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = Double(pos) / 1000.0
        }
        if let dur = audioState["durationMs"] as? Int, dur > 0 {
            info[MPMediaItemPropertyPlaybackDuration] = Double(dur) / 1000.0
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: - Utilities & Cache Sync
    private func triggerHaptic(style: String) {
        guard hapticsEnabled else { return }
        DispatchQueue.main.async {
            let gen = UIImpactFeedbackGenerator(style: style == "medium" ? .medium : .light)
            gen.impactOccurred()
        }
    }

    private func loadStoredArray(forKey key: String) -> [[String: Any]] {
        guard let str = UserDefaults.standard.string(forKey: key),
              let data = str.data(using: .utf8),
              let arr = (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]] else { return [] }
        return arr
    }

    private func saveStoredArray(_ arr: [[String: Any]], forKey key: String) {
        if let data = try? JSONSerialization.data(withJSONObject: arr),
           let str = String(data: data, encoding: .utf8) {
            UserDefaults.standard.set(str, forKey: key)
        }
    }

    private func serializedStoredArray(forKey key: String) -> String {
        return UserDefaults.standard.string(forKey: key) ?? "[]"
    }

    private func upsertStoredItem(_ item: [String: Any], key: String, idField: String = "id") {
        var arr = loadStoredArray(forKey: key)
        if let itemId = item[idField] as? String, !itemId.isEmpty,
           let idx = arr.firstIndex(where: { ($0[idField] as? String) == itemId }) {
            arr[idx] = item
        } else {
            arr.insert(item, at: 0)
        }
        saveStoredArray(arr, forKey: key)
    }

    private func syncDownloadsCacheToJS() {
        let s = serializedStoredArray(forKey: downloadsKey)
        owner?.evalJS("window.__midadCache.downloads=\(s);window.KTB&&window.KTB.ev&&window.KTB.ev('dlUpdate',{});")
    }

    private func syncLocalCacheToJS() {
        let s = serializedStoredArray(forKey: localBooksKey)
        owner?.evalJS("window.__midadCache.localBooks=\(s);window.KTB&&window.KTB.ev&&window.KTB.ev('localUpdate',{});")
    }

    private func syncAudioCacheToJS() {
        let s = jsonString(from: audioState) ?? "{}"
        owner?.evalJS("window.__midadCache.audioState=\(s);window.KTB&&window.KTB.ev&&window.KTB.ev('audioState',\(s));")
    }

    private func sanitizeFilename(_ name: String) -> String {
        let bad = CharacterSet(charactersIn: "/\\:?%*|\"<>")
        let clean = name.components(separatedBy: bad).joined(separator: "_").trimmingCharacters(in: .whitespacesAndNewlines)
        return clean.isEmpty ? "Midad_Book" : String(clean.prefix(80))
    }

    private func jsonString(from obj: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(obj),
              let data = try? JSONSerialization.data(withJSONObject: obj),
              let str = String(data: data, encoding: .utf8) else { return nil }
        return str
    }

    private func quoteJS(_ s: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: [s])
        let str = data.flatMap { String(data: $0, encoding: .utf8) } ?? "[\"\"]"
        return String(str.dropFirst().dropLast())
    }
}

extension UIColor {
    static func midadHex(_ hex: String) -> UIColor? {
        var c = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if c.hasPrefix("#") { c.removeFirst() }
        if c.count == 8 { c = String(c.dropFirst(2)) }
        guard c.count == 6, let val = UInt64(c, radix: 16) else { return nil }
        return UIColor(
            red: CGFloat((val >> 16) & 0xff) / 255.0,
            green: CGFloat((val >> 8) & 0xff) / 255.0,
            blue: CGFloat(val & 0xff) / 255.0,
            alpha: 1.0
        )
    }
}
