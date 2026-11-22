import UIKit
import PDFKit
import PencilKit
import WebKit

final class MidadReaderViewController: UIViewController {
    enum ReadTheme: Int { case day = 0, sepia = 1, sage = 2, night = 3 }

    private let uriString: String
    private let fileName: String
    private let bookTitle: String
    private let isPdf: Bool

    private var pdfView: PDFView?
    private var webReader: WKWebView?
    private var canvasView: PKCanvasView!
    private var toolPicker: PKToolPicker?

    private var topBar: UIView!
    private var botBar: UIView!
    private var penPanel: UIView!
    private var pageSlider: UISlider!
    private var pageLabel: UILabel!
    private var titleLabel: UILabel!
    private var penToggleBtn: UIButton!
    private var themeBtn: UIButton!
    private var bookmarkBtn: UIButton!

    private var penActive = false
    private var currentTheme = ReadTheme(rawValue: UserDefaults.standard.integer(forKey: "midad_ios_reader_theme")) ?? .sepia
    private var bookmarksKey: String { "midad_ios_bm_\(uriString.hashValue)" }
    private var pageKey: String { "midad_ios_pg_\(uriString.hashValue)" }
    private var drawingKey: String { "midad_ios_pk_\(uriString.hashValue)" }

    init(uriString: String, fileName: String, bookTitle: String) {
        self.uriString = uriString
        self.fileName = fileName
        self.bookTitle = bookTitle.isEmpty ? fileName : bookTitle
        self.isPdf = fileName.lowercased().hasSuffix(".pdf") || uriString.lowercased().contains(".pdf")
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) { fatalError() }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        currentTheme == .night ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        buildReaderSurface()
        buildChromeBars()
        loadDocument()
        applyTheme()
    }

    private func buildReaderSurface() {
        if isPdf {
            let pv = PDFView()
            pv.autoScales = true
            pv.displayMode = .singlePageContinuous
            pv.displayDirection = .vertical
            pv.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(pv)
            NSLayoutConstraint.activate([
                pv.topAnchor.constraint(equalTo: view.topAnchor),
                pv.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                pv.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                pv.bottomAnchor.constraint(equalTo: view.bottomAnchor)
            ])
            NotificationCenter.default.addObserver(self, selector: #selector(onPdfPageChanged), name: .PDFViewPageChanged, object: pv)
            self.pdfView = pv
        } else {
            let cfg = WKWebViewConfiguration()
            let wv = WKWebView(frame: .zero, configuration: cfg)
            wv.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(wv)
            NSLayoutConstraint.activate([
                wv.topAnchor.constraint(equalTo: view.topAnchor),
                wv.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                wv.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                wv.bottomAnchor.constraint(equalTo: view.bottomAnchor)
            ])
            self.webReader = wv
        }

        // Apple Pencil / Finger Pen + Marker Overlay (PencilKit)
        canvasView = PKCanvasView()
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.drawingPolicy = .anyInput
        canvasView.isUserInteractionEnabled = false
        canvasView.translatesAutoresizingMaskIntoConstraints = false
        if let raw = UserDefaults.standard.data(forKey: drawingKey),
           let dr = try? PKDrawing(data: raw) {
            canvasView.drawing = dr
        }
        view.addSubview(canvasView)
        NSLayoutConstraint.activate([
            canvasView.topAnchor.constraint(equalTo: view.topAnchor),
            canvasView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            canvasView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            canvasView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func buildChromeBars() {
        topBar = UIView()
        topBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(topBar)

        let row = UIStackView()
        row.axis = .horizontal
        row.alignment = .center
        row.spacing = 8
        row.translatesAutoresizingMaskIntoConstraints = false
        topBar.addSubview(row)

        let backBtn = makeIconBarButton(systemName: "chevron.right", action: #selector(closeTapped))
        titleLabel = UILabel()
        titleLabel.text = bookTitle
        titleLabel.font = .boldSystemFont(ofSize: 15)
        titleLabel.lineBreakMode = .byTruncatingTail

        penToggleBtn = makeIconBarButton(systemName: "pencil.tip.crop.circle", action: #selector(togglePenTapped))
        themeBtn = makeIconBarButton(systemName: "circle.lefthalf.filled", action: #selector(cycleThemeTapped))
        bookmarkBtn = makeIconBarButton(systemName: "bookmark", action: #selector(toggleBookmarkTapped))
        let menuBtn = makeIconBarButton(systemName: "ellipsis.circle", action: #selector(openReaderMenuTapped))

        row.addArrangedSubview(backBtn)
        row.addArrangedSubview(titleLabel)
        row.addArrangedSubview(penToggleBtn)
        row.addArrangedSubview(themeBtn)
        row.addArrangedSubview(bookmarkBtn)
        row.addArrangedSubview(menuBtn)

        // Compact Icon-Only Pen / Marker / Undo / Redo Strip (fits screen width)
        penPanel = buildPenIconPanel()
        penPanel.isHidden = true
        penPanel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(penPanel)

        // Bottom Seek & Progress Bar
        botBar = UIView()
        botBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(botBar)

        pageSlider = UISlider()
        pageSlider.translatesAutoresizingMaskIntoConstraints = false
        pageSlider.addTarget(self, action: #selector(sliderChanged), for: .valueChanged)

        pageLabel = UILabel()
        pageLabel.font = .monospacedDigitSystemFont(ofSize: 12, weight: .semibold)
        pageLabel.textAlignment = .center
        pageLabel.text = "1 / 1"
        pageLabel.translatesAutoresizingMaskIntoConstraints = false

        botBar.addSubview(pageSlider)
        botBar.addSubview(pageLabel)

        NSLayoutConstraint.activate([
            topBar.topAnchor.constraint(equalTo: view.topAnchor),
            topBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            topBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            row.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 6),
            row.leadingAnchor.constraint(equalTo: topBar.leadingAnchor, constant: 12),
            row.trailingAnchor.constraint(equalTo: topBar.trailingAnchor, constant: -12),
            row.bottomAnchor.constraint(equalTo: topBar.bottomAnchor, constant: -8),

            penPanel.topAnchor.constraint(equalTo: topBar.bottomAnchor, constant: 6),
            penPanel.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            botBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            botBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            botBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            pageSlider.topAnchor.constraint(equalTo: botBar.topAnchor, constant: 8),
            pageSlider.leadingAnchor.constraint(equalTo: botBar.leadingAnchor, constant: 18),
            pageSlider.trailingAnchor.constraint(equalTo: botBar.trailingAnchor, constant: -18),

            pageLabel.topAnchor.constraint(equalTo: pageSlider.bottomAnchor, constant: 4),
            pageLabel.centerXAnchor.constraint(equalTo: botBar.centerXAnchor),
            pageLabel.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8)
        ])
    }

    private func buildPenIconPanel() -> UIView {
        let card = UIView()
        card.layer.cornerRadius = 16
        card.layer.borderWidth = 1
        card.layer.borderColor = UIColor.systemGray3.withAlphaComponent(0.4).cgColor

        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 6
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)

        stack.addArrangedSubview(makeIconBarButton(systemName: "pencil.tip", action: #selector(selectPenNib)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "highlighter", action: #selector(selectMarkerTip)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "eraser", action: #selector(selectEraserTip)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "arrow.uturn.backward", action: #selector(undoStroke)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "arrow.uturn.forward", action: #selector(redoStroke)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "trash", action: #selector(clearStrokes)))
        stack.addArrangedSubview(makeIconBarButton(systemName: "checkmark.circle.fill", action: #selector(togglePenTapped)))

        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor, constant: 6),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -6),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 10),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -10)
        ])
        return card
    }

    private func makeIconBarButton(systemName: String, action: Selector) -> UIButton {
        let btn = UIButton(type: .system)
        let cfg = UIImage.SymbolConfiguration(pointSize: 16, weight: .semibold)
        btn.setImage(UIImage(systemName: systemName, withConfiguration: cfg), for: .normal)
        btn.addTarget(self, action: action, for: .touchUpInside)
        btn.widthAnchor.constraint(equalToConstant: 34).isActive = true
        btn.heightAnchor.constraint(equalToConstant: 34).isActive = true
        btn.layer.cornerRadius = 10
        return btn
    }

    private func loadDocument() {
        guard let url = URL(string: uriString) else { return }
        if isPdf, let pv = pdfView {
            if let doc = PDFDocument(url: url) {
                pv.document = doc
                let savedIdx = max(0, min(doc.pageCount - 1, UserDefaults.standard.integer(forKey: pageKey)))
                if let p = doc.page(at: savedIdx) { pv.go(to: p) }
                pageSlider.minimumValue = 0
                pageSlider.maximumValue = Float(max(0, doc.pageCount - 1))
                pageSlider.value = Float(savedIdx)
                pageLabel.text = "\(savedIdx + 1) / \(doc.pageCount)"
            }
        } else if let wv = webReader {
            if url.isFileURL {
                wv.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
            } else {
                wv.load(URLRequest(url: url))
            }
        }
    }

    @objc private func onPdfPageChanged() {
        guard let pv = pdfView, let doc = pv.document, let cur = pv.currentPage else { return }
        let idx = doc.index(for: cur)
        UserDefaults.standard.set(idx, forKey: pageKey)
        pageSlider.value = Float(idx)
        pageLabel.text = "\(idx + 1) / \(doc.pageCount)"
    }

    @objc private func sliderChanged() {
        guard let pv = pdfView, let doc = pv.document else { return }
        let idx = Int(round(pageSlider.value))
        if let p = doc.page(at: idx) { pv.go(to: p) }
    }

    @objc private func togglePenTapped() {
        penActive.toggle()
        penPanel.isHidden = !penActive
        canvasView.isUserInteractionEnabled = penActive
        if penActive {
            selectPenNib()
            let picker = toolPicker ?? PKToolPicker()
            toolPicker = picker
            picker.setVisible(true, forFirstResponder: canvasView)
            picker.addObserver(canvasView)
            canvasView.becomeFirstResponder()
        } else {
            toolPicker?.setVisible(false, forFirstResponder: canvasView)
            canvasView.resignFirstResponder()
            UserDefaults.standard.set(canvasView.drawing.dataRepresentation(), forKey: drawingKey)
        }
    }

    @objc private func selectPenNib() {
        let inkColor: UIColor = (currentTheme == .night) ? .white : .label
        canvasView.tool = PKInkingTool(.pen, color: inkColor, width: 4)
    }

    @objc private func selectMarkerTip() {
        canvasView.tool = PKInkingTool(.marker, color: UIColor.systemYellow.withAlphaComponent(0.65), width: 18)
    }

    @objc private func selectEraserTip() {
        canvasView.tool = PKEraserTool(.vector)
    }

    @objc private func undoStroke() {
        canvasView.undoManager?.undo()
        UserDefaults.standard.set(canvasView.drawing.dataRepresentation(), forKey: drawingKey)
    }

    @objc private func redoStroke() {
        canvasView.undoManager?.redo()
        UserDefaults.standard.set(canvasView.drawing.dataRepresentation(), forKey: drawingKey)
    }

    @objc private func clearStrokes() {
        canvasView.drawing = PKDrawing()
        UserDefaults.standard.removeObject(forKey: drawingKey)
    }

    @objc private func cycleThemeTapped() {
        currentTheme = ReadTheme(rawValue: (currentTheme.rawValue + 1) % 4) ?? .day
        UserDefaults.standard.set(currentTheme.rawValue, forKey: "midad_ios_reader_theme")
        applyTheme()
    }

    private func applyTheme() {
        let bg: UIColor
        let bar: UIColor
        let fg: UIColor
        let accent: UIColor

        switch currentTheme {
        case .night:
            bg = UIColor(red: 20/255, green: 21/255, blue: 23/255, alpha: 1)
            bar = UIColor(red: 27/255, green: 28/255, blue: 31/255, alpha: 0.94)
            fg = UIColor(red: 229/255, green: 226/255, blue: 216/255, alpha: 1)
            accent = UIColor(red: 52/255, green: 211/255, blue: 153/255, alpha: 1)
        case .sepia:
            bg = UIColor(red: 239/255, green: 229/255, blue: 205/255, alpha: 1)
            bar = UIColor(red: 233/255, green: 219/255, blue: 187/255, alpha: 0.95)
            fg = UIColor(red: 61/255, green: 47/255, blue: 30/255, alpha: 1)
            accent = UIColor(red: 154/255, green: 84/255, blue: 13/255, alpha: 1)
        case .sage:
            bg = UIColor(red: 227/255, green: 236/255, blue: 228/255, alpha: 1)
            bar = UIColor(red: 213/255, green: 228/255, blue: 215/255, alpha: 0.95)
            fg = UIColor(red: 27/255, green: 45/255, blue: 34/255, alpha: 1)
            accent = UIColor(red: 4/255, green: 120/255, blue: 87/255, alpha: 1)
        case .day:
            bg = UIColor(red: 248/255, green: 250/255, blue: 252/255, alpha: 1)
            bar = UIColor.white.withAlphaComponent(0.95)
            fg = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1)
            accent = UIColor(red: 5/255, green: 150/255, blue: 105/255, alpha: 1)
        }

        view.backgroundColor = bg
        pdfView?.backgroundColor = bg
        topBar.backgroundColor = bar
        botBar.backgroundColor = bar
        penPanel.backgroundColor = bar
        penPanel.tintColor = accent
        topBar.tintColor = accent
        titleLabel.textColor = fg
        pageLabel.textColor = fg
        pageSlider.minimumTrackTintColor = accent
        setNeedsStatusBarAppearanceUpdate()
    }

    @objc private func toggleBookmarkTapped() {
        let idx = Int(round(pageSlider.value))
        var arr = UserDefaults.standard.array(forKey: bookmarksKey) as? [Int] ?? []
        if let i = arr.firstIndex(of: idx) { arr.remove(at: i) } else { arr.append(idx) }
        UserDefaults.standard.set(arr, forKey: bookmarksKey)
        let marked = arr.contains(idx)
        bookmarkBtn.setImage(UIImage(systemName: marked ? "bookmark.fill" : "bookmark"), for: .normal)
    }

    @objc private func openReaderMenuTapped() {
        let ac = UIAlertController(title: "أدوات القارئ", message: nil, preferredStyle: .actionSheet)
        ac.addAction(UIAlertAction(title: "تفعيل القلم والماركر", style: .default) { _ in self.togglePenTapped() })
        ac.addAction(UIAlertAction(title: "تراجع عن آخر خطوة", style: .default) { _ in self.undoStroke() })
        ac.addAction(UIAlertAction(title: "تبديل المظهر (نهاري/دافئ/مريح/داكن)", style: .default) { _ in self.cycleThemeTapped() })
        ac.addAction(UIAlertAction(title: "مشاركة الكتاب", style: .default) { _ in
            guard let url = URL(string: self.uriString) else { return }
            let sh = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sh.popoverPresentationController?.sourceView = self.topBar
            sh.popoverPresentationController?.sourceRect = self.topBar.bounds
            self.present(sh, animated: true)
        })
        ac.addAction(UIAlertAction(title: "إغلاق", style: .cancel))
        ac.popoverPresentationController?.sourceView = topBar
        ac.popoverPresentationController?.sourceRect = topBar.bounds
        present(ac, animated: true)
    }

    @objc private func closeTapped() {
        UserDefaults.standard.set(canvasView.drawing.dataRepresentation(), forKey: drawingKey)
        dismiss(animated: true)
    }
}
