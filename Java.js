// ========== حالة التطبيق ==========
let isLoggedIn = false;
let currentUsername = "";
let userReports = JSON.parse(localStorage.getItem('userReports')) || [];
let map;
let userMarker;
let mediaRecorder = null;
let currentStream = null;
let audioChunks = [];
let isRecording = false;
let tourActive = false;
let currentStep = 0;

// ========== إعدادات البث المباشر والملفات ==========
let liveStream = null;
let recordedChunks = [];
let liveStreamMediaRecorder = null;
let attachedFiles = [];

// ========== إعدادات إمكانية الوصول  ==========
let accessibilitySettings = JSON.parse(localStorage.getItem('accessibilitySettings')) || {
    fontSize: 'normal',
    highContrast: false,
    textToSpeech: false
};

// ========== حالة التطبيق  ==========
const appState = {
    isInitialized: false,
    hasErrors: false,
    errors: []
};

function logError(error, context) {
    console.error(`Error in ${context}:`, error);
    appState.errors.push({ error, context, timestamp: Date.now() });
    appState.hasErrors = appState.errors.length > 0;
}

// ========== قاعدة بيانات التهديدات  ==========
const securityThreats = {
    dangerousExtensions: {
        highRisk: ['exe', 'bat', 'cmd', 'msi', 'scr', 'dll', 'com', 'js', 'vbs', 'ps1', 'jar', 'app', 'pkg', 'deb', 'rpm'],
        mediumRisk: ['zip', 'rar', '7z', 'tar', 'gz', 'iso', 'dmg'],
        lowRisk: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
    },
    
    suspiciousPatterns: {
        domains: [
            /\.tk$/i, /\.ml$/i, /\.ga$/i, /\.cf$/i, /\.gq$/i,
            /\.xyz$/i, /\.top$/i, /\.club$/i, /\.loan$/i, /\.work$/i,
            /\.site$/i, /\.win$/i, /\.bid$/i, /\.vip$/i, /\.party$/i
        ],
        keywords: [
            'free', 'crack', 'serial', 'keygen', 'torrent', 'download',
            'warez', 'nulled', 'premium', 'fullversion', 'activated',
            'patch', 'keygenerator', 'licensekey', 'registrationcode'
        ],
        urlPatterns: [
            /phishing/i, /malware/i, /virus/i, /trojan/i, /ransomware/i,
            /spyware/i, /keylogger/i, /exploit/i, /backdoor/i, /rootkit/i
        ]
    },
    
    blacklistedDomains: [
        'malicious-site.com', 'phishing-attack.net', 'virus-download.org',
        'free-cracks.xyz', 'torrent-warez.top'
    ]
};

// ========== عناصر واجهة المستخدم ==========
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');

const registerPassword = document.getElementById('registerPassword');
const passwordStrength = document.getElementById('passwordStrength');
const passwordFeedback = document.getElementById('passwordFeedback');

// نظام فحص الأمان 
const securityCheckInput = document.getElementById('securityCheckInput');
const securityCheckBtn = document.getElementById('securityCheckBtn');
const securityCheckResult = document.getElementById('securityCheckResult');

// نظام المصادقة 
const loginContainer = document.getElementById('loginContainer');
const registerContainer = document.getElementById('registerContainer');
const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
const closeLogin = document.getElementById('closeLogin');
const closeRegister = document.getElementById('closeRegister');
const closeForgotPassword = document.getElementById('closeForgotPassword');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLogin = document.getElementById('backToLogin');

// عناصر التنقل
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const homeLink = document.getElementById('homeLink');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// عناصر أخرى
const heroReportBtn = document.getElementById('heroReportBtn');
const pageReportBtn = document.getElementById('pageReportBtn');
const reportContainer = document.getElementById('reportContainer');
const closeReport = document.getElementById('closeReport');
const reportForm = document.getElementById('reportForm');

// تحديد الموقع والخريطة  
const detectLocation = document.getElementById('detectLocation');
const reportLocation = document.getElementById('reportLocation');
const mapContainer = document.getElementById('map');
const mapPlaceholder = document.getElementById('mapPlaceholder');

// الجولة التعريفية  
const tourContainer = document.getElementById('tourContainer');
const tourLauncher = document.getElementById('tourLauncher');
const tourSkip = document.getElementById('tourSkip');
const tourPrev = document.getElementById('tourPrev');
const tourNext = document.getElementById('tourNext');
const tourFinish = document.getElementById('tourFinish');
const tourTitle = document.getElementById('tourTitle');
const tourDescription = document.getElementById('tourDescription');
const tourProgressBar = document.querySelector('.tour-progress-bar');
const tourProgressSteps = document.querySelector('.tour-progress-steps');

// الشات بوت
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessage = document.getElementById('sendMessage');
const chatVoiceRecord = document.getElementById('chatVoiceRecord');
const chatAttachment = document.getElementById('chatAttachment');

// إمكانية الوصول
const accessibilityBtn = document.getElementById('accessibilityBtn');
const accessibilityPanel = document.getElementById('accessibilityPanel');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const highContrastToggle = document.getElementById('highContrastToggle');
const textToSpeechToggle = document.getElementById('textToSpeechToggle');

// الأسئلة الشائعة
const faqItems = document.querySelectorAll('.faq-item');

// معاينة PDF
const pdfViewerContainer = document.getElementById('pdfViewerContainer');
const pdfFrame = document.getElementById('pdfFrame');
const pdfViewerTitle = document.getElementById('pdfViewerTitle');
const pdfDownloadLink = document.getElementById('pdfDownloadLink');
const closePdfViewer = document.getElementById('closePdfViewer');
const closePdfBtn = document.getElementById('closePdfBtn');

// ========== خطوات الجولة  ==========
const tourSteps = [
    {
        title: "مرحباً بك في منصة أبطال الوعي",
        description: "سنأخذك في جولة سريعة لتتعرف على أهم الميزات التي نقدمها",
        element: null,
        position: "center"
    },
    {
        title: "التنقل بين الصفحات",
        description: "استخدم القائمة الرئيسية للتنقل بين أقسام المنصة المختلفة",
        element: document.querySelector('nav'),
        position: "bottom"
    },
    {
        title: "الإبلاغ عن حالة",
        description: "يمكنك الإبلاغ عن حالات التنمر أو التحرش الإلكتروني من خلال هذا الزر",
        element: document.getElementById('heroReportBtn'),
        position: "top"
    },
    {
        title: "أرقام الطوارئ",
        description: "هنا ستجد أهم أرقام الطوارئ للاتصال في الحالات الحرجة",
        element: document.querySelector('.emergency-numbers'),
        position: "top"
    },
    {
        title: "فحص الأمان",
        description: "يمكنك فحص الروابط والملفات للتأكد من سلامتها قبل استخدامها",
        element: document.querySelector('.security-check'),
        position: "top"
    },
    {
        title: "المساعد الافتراضي",
        description: "مساعدنا الافتراضي جاهز لمساعدتك في أي وقت",
        element: document.querySelector('.chatbot-container'),
        position: "left"
    }
];

// ========== نظام الجولة التعريفية  ==========
function startTour() {
    // التحقق من توفر العناصر المطلوبة
    const availableSteps = tourSteps.filter(step => 
        !step.element || (step.element && document.body.contains(step.element))
    );
    
    if (availableSteps.length === 0) {
        showNotification('عذراً، لا يمكن بدء الجولة حالياً', 'error');
        return;
    }
    
    if (availableSteps.length < tourSteps.length) {
        console.warn('بعض عناصر الجولة غير متوفرة:', 
            tourSteps.filter(step => step.element && !document.body.contains(step.element))
        );
    }
    
    tourActive = true;
    currentStep = 0;
    if (tourContainer) tourContainer.style.display = 'flex';
    showStep(currentStep);
}

function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) return;
    
    const step = tourSteps[stepIndex];
    if (tourTitle) tourTitle.textContent = step.title;
    if (tourDescription) tourDescription.textContent = step.description;
    
    // تحديث شريط التقدم
    const progressPercent = ((stepIndex + 1) / tourSteps.length) * 100;
    if (tourProgressBar) tourProgressBar.style.width = `${progressPercent}%`;
    
    // إظهار/إخفاء أزرار التنقل
    if (tourPrev) tourPrev.style.display = stepIndex > 0 ? 'inline-block' : 'none';
    if (tourNext) tourNext.style.display = stepIndex < tourSteps.length - 1 ? 'inline-block' : 'none';
    if (tourFinish) tourFinish.style.display = stepIndex === tourSteps.length - 1 ? 'inline-block' : 'none';
    
    // إزالة التظليلات السابقة
    document.querySelectorAll('.tour-highlight').forEach(el => el.remove());
    
    // إذا كان هناك عنصر مستهدف وكان موجوداً في الصفحة
    if (step.element && step.element instanceof HTMLElement && document.body.contains(step.element)) {
        const highlight = document.createElement('div');
        highlight.className = 'tour-highlight';
        
        const rect = step.element.getBoundingClientRect();
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.top = `${rect.top + window.scrollY}px`;
        highlight.style.left = `${rect.left + window.scrollX}px`;
        
        document.body.appendChild(highlight);
        
        // التمرير إلى العنصر
        if (step.position !== "center") {
            step.element.scrollIntoView({ 
                behavior: 'smooth', 
                block: step.position === "top" ? 'start' : 
                       step.position === "bottom" ? 'end' : 'center'
            });
        }
    }
}

function nextStep() {
    if (currentStep < tourSteps.length - 1) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

function finishTour() {
    tourActive = false;
    if (tourContainer) tourContainer.style.display = 'none';
    document.querySelectorAll('.tour-highlight').forEach(el => el.remove());
    
    localStorage.setItem('tourCompleted', 'true');
    showNotification('تم إنهاء الجولة التعريفية بنجاح!', 'success');
}

function skipTour() {
    if (confirm('هل تريد تخطي الجولة التعريفية؟')) {
        finishTour();
    }
}

function checkFirstTimeUser() {
    setTimeout(() => {
        const tourCompleted = localStorage.getItem('tourCompleted');
        
        if (!tourCompleted) {
            setTimeout(() => {
                if (confirm('مرحباً بك في منصة أبطال الوعي! هل تريد بدء جولة تعريفية بالمنصة؟')) {
                    startTour();
                } else {
                    localStorage.setItem('tourCompleted', 'true');
                }
            }, 3000);
        }
    }, 1000);
}

// ========== نظام فحص الأمان  ==========
async function checkSecurityEnhanced(input) {
    return new Promise((resolve) => {
        setTimeout(async () => {
            input = input.trim().toLowerCase();
            
            const isUrl = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$|^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(input);
            const isFile = /\.([a-zA-Z0-9]+)$/i.test(input);
            
            let result = {
                safe: false,
                warning: false,
                message: "",
                threatLevel: "unknown",
                details: []
            };

            if (isUrl) {
                result = await analyzeURL(input);
            } else if (isFile) {
                result = analyzeFile(input);
            } else {
                result.safe = false;
                result.message = "❌ <strong>غير صالح:</strong> المدخل غير صالح.<br><small>يرجى إدخال رابط ويب صحيح أو اسم ملف بامتداد.</small>";
                result.threatLevel = "invalid";
            }

            resolve(result);
        }, 1500);
    });
}

// تحليل متقدم للروابط
async function analyzeURL(url) {
    const result = {
        safe: false,
        warning: false,
        message: "",
        threatLevel: "unknown",
        details: []
    };

    try {
        let domain = url;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        domain = new URL(url).hostname;

        // الفحص متعدد الطبقات
        const checks = [
            checkDomainReputation(domain),
            checkSuspiciousPatterns(url),
            checkBlacklist(domain),
            checkURLStructure(url)
        ];

        const checkResults = await Promise.allSettled(checks);
        
        checkResults.forEach((check, index) => {
            if (check.status === 'fulfilled' && check.value) {
                result.details.push(check.value);
            }
        });

        // تحديد مستوى التهديد بناء على النتائج
        const threatScore = calculateThreatScore(result.details);
        
        if (threatScore >= 8) {
            result.safe = false;
            result.threatLevel = "critical";
            result.message = `🚫 <strong>خطر شديد:</strong> الرابط "${domain}" تم التعرف عليه كموقع ضار للغاية.<br><small>${result.details.join(' ')} لا تقم بزيارة هذا الرابط!</small>`;
        } else if (threatScore >= 5) {
            result.safe = false;
            result.warning = true;
            result.threatLevel = "high";
            result.message = `⚠️ <strong>خطر عالي:</strong> الرابط "${domain}" مشبوه جداً.<br><small>${result.details.join(' ')} تجنب زيارة هذا الرابط.</small>`;
        } else if (threatScore >= 3) {
            result.safe = false;
            result.warning = true;
            result.threatLevel = "medium";
            result.message = `⚠️ <strong>تحذير:</strong> الرابط "${domain}" قد يكون خطيراً.<br><small>${result.details.join(' ')} كن حذراً جداً.</small>`;
        } else if (threatScore >= 1) {
            result.safe = true;
            result.warning = true;
            result.threatLevel = "low";
            result.message = `🔶 <strong>تنبيه:</strong> الرابط "${domain}" به بعض المؤشرات المشبوهة.<br><small>${result.details.join(' ')} يمكنك المتابعة بحذر.</small>`;
        } else {
            result.safe = true;
            result.threatLevel = "safe";
            result.message = `✓ <strong>آمن:</strong> الرابط "${domain}" لا يحتوي على تهديدات معروفة.<br><small>يمكنك المتابعة بحذر.</small>`;
        }

    } catch (error) {
        result.safe = false;
        result.message = "❌ <strong>خطأ في الفحص:</strong> تعذر تحليل الرابط.<br><small>يرجى التحقق من صحة الرابط والمحاولة مرة أخرى.</small>";
        result.threatLevel = "error";
    }

    return result;
}

// تحليل متقدم للملفات
function analyzeFile(filename) {
    const result = {
        safe: false,
        warning: false,
        message: "",
        threatLevel: "unknown",
        details: []
    };

    const extension = filename.split('.').pop().toLowerCase();
    
    // فحص الامتدادات الخطرة
    if (securityThreats.dangerousExtensions.highRisk.includes(extension)) {
        result.details.push(`امتداد ${extension} معروف بخطورته العالية`);
    }
    
    if (securityThreats.dangerousExtensions.mediumRisk.includes(extension)) {
        result.details.push(`امتداد ${extension} يمكن أن يحتوي على ملفات خطرة`);
    }

    // فحص الأنماط المشبوهة في اسم الملف
    securityThreats.suspiciousPatterns.keywords.forEach(keyword => {
        if (filename.includes(keyword)) {
            result.details.push(`اسم الملف يحتوي على كلمة مشبوهة: ${keyword}`);
        }
    });

    // فحص طول اسم الملف (مؤشر محتمل على البرمجيات الخبيثة)
    if (filename.length > 50) {
        result.details.push(`اسم الملف طويل جداً (مؤشر مشبوه)`);
    }

    // فحص الأحرف الخاصة في اسم الملف
    const specialChars = /[\!\@\#\$\%\^\&\*\(\)\+\=\[\]\{\}\|\;\:\'\"\<\>\?\,\.\/\\]/;
    if (specialChars.test(filename)) {
        result.details.push(`اسم الملف يحتوي على أحرف خاصة غير عادية`);
    }

    const threatScore = calculateThreatScore(result.details);

    if (threatScore >= 7) {
        result.safe = false;
        result.threatLevel = "critical";
        result.message = `🚫 <strong>خطر شديد:</strong> الملف "${filename}" خطير للغاية.<br><small>${result.details.join(' ')} لا تقم بفتح أو تحميل هذا الملف!</small>`;
    } else if (threatScore >= 4) {
        result.safe = false;
        result.warning = true;
        result.threatLevel = "high";
        result.message = `⚠️ <strong>خطر عالي:</strong> الملف "${filename}" مشبوه جداً.<br><small>${result.details.join(' ')} تجنب هذا الملف.</small>`;
    } else if (threatScore >= 2) {
        result.safe = false;
        result.warning = true;
        result.threatLevel = "medium";
        result.message = `⚠️ <strong>تحذير:</strong> الملف "${filename}" قد يكون خطيراً.<br><small>${result.details.join(' ')} كن حذراً جداً.</small>`;
    } else {
        result.safe = true;
        result.threatLevel = "safe";
        result.message = `✓ <strong>آمن:</strong> امتداد الملف "${extension}" آمن بشكل عام.<br><small>${result.details.join(' ') || 'يرجى التأكد من مصدر الملف قبل فتحه.'}</small>`;
    }

    return result;
}

// فحص سمعة النطاق
async function checkDomainReputation(domain) {
    // فحص عمر النطاق (النطاقات الجديدة أكثر خطورة)
    const newDomainThreshold = 30; // أيام
    
    // فحص امتدادات النطاق المشبوهة
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    const hasSuspiciousTLD = suspiciousTLDs.some(tld => domain.endsWith(tld));
    
    if (hasSuspiciousTLD) {
        return "امتداد النطاق مشبوه";
    }
    
    // فحص طول النطاق (النطاقات الطويلة قد تكون مشبوهة)
    if (domain.length > 30) {
        return "اسم النطاق طويل جداً (مشبوه)";
    }
    
    return null;
}

// فحص الأنماط المشبوهة
function checkSuspiciousPatterns(url) {
    // فحص الكلمات المفتاحية المشبوهة
    const foundKeywords = securityThreats.suspiciousPatterns.keywords.filter(keyword => 
        url.includes(keyword)
    );
    
    if (foundKeywords.length > 0) {
        return `يحتوي على كلمات مشبوهة: ${foundKeywords.join(', ')}`;
    }
    
    // فحص أنماط الروابط الضارة
    const foundPatterns = securityThreats.suspiciousPatterns.urlPatterns.filter(pattern => 
        pattern.test(url)
    );
    
    if (foundPatterns.length > 0) {
        return "يحتوي على أنماط روابط ضارة معروفة";
    }
    
    return null;
}

// الفحص ضد القائمة السوداء
function checkBlacklist(domain) {
    if (securityThreats.blacklistedDomains.includes(domain)) {
        return "موجود في القائمة السوداء للروابط الضارة";
    }
    
    // فحص النطاقات الفرعية
    const isSubdomainOfBlacklisted = securityThreats.blacklistedDomains.some(blacklisted => 
        domain.endsWith('.' + blacklisted)
    );
    
    if (isSubdomainOfBlacklisted) {
        return "نطاق فرعي لموقع معروف بخطورته";
    }
    
    return null;
}

// فحص هيكل الرابط
function checkURLStructure(url) {
    // فحص عناوين IP مباشرة (قد تكون مشبوهة)
    const ipPattern = /https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
        return "يستخدم عنوان IP مباشر (مشبوه)";
    }
    
    // فحص المنافذ غير القياسية
    const nonStandardPort = /https?:\/\/[^:]+:(\d+)/;
    const match = url.match(nonStandardPort);
    if (match) {
        const port = parseInt(match[1]);
        if (port !== 80 && port !== 443 && port !== 8080) {
            return `يستخدم منفذ غير قياسي: ${port} (مشبوه)`;
        }
    }
    
    return null;
}

// حساب درجة التهديد
function calculateThreatScore(details) {
    let score = 0;
    
    details.forEach(detail => {
        if (detail.includes("خطر شديد") || detail.includes("خطير للغاية")) score += 3;
        else if (detail.includes("خطر عالي") || detail.includes("مشبوه جداً")) score += 2;
        else if (detail.includes("تحذير") || detail.includes("مشبوه")) score += 1;
        else if (detail.includes("تنبيه")) score += 0.5;
    });
    
    return score;
}

// ========== تهيئة البث المباشر ==========
function initLiveStreaming() {
    const startLiveStreamBtn = document.getElementById('startLiveStream');
    const stopLiveStreamBtn = document.getElementById('stopLiveStream');
    const cancelLiveStreamBtn = document.getElementById('cancelLiveStream');

    if (startLiveStreamBtn) {
        startLiveStreamBtn.addEventListener('click', startLiveStream);
    }
    
    if (stopLiveStreamBtn) {
        stopLiveStreamBtn.addEventListener('click', stopLiveStream);
    }
    
    if (cancelLiveStreamBtn) {
        cancelLiveStreamBtn.addEventListener('click', cancelLiveStream);
    }
}

// ========== إدارة الملفات المرفقة ==========
function initFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('fileInput');
    
    if (fileUpload && fileInput) {
        // النقر لرفع الملفات
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });
        
        // سحب وإفلات الملفات
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.style.backgroundColor = '#f0f8ff';
        });
        
        fileUpload.addEventListener('dragleave', () => {
            fileUpload.style.backgroundColor = '';
        });
        
        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.style.backgroundColor = '';
            
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        });
        
        // تغيير الملفات المختارة
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });
    }
}

// ========== تهيئة إرسال البلاغات ==========
function initReportSubmission() {
    const submitReportBtn = document.getElementById('submitReport');
    const cancelReportBtn = document.getElementById('cancelReport');
    const reportTypes = document.querySelectorAll('.report-type');
    
    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', handleReportSubmission);
    }
    
    if (cancelReportBtn) {
        cancelReportBtn.addEventListener('click', cancelReport);
    }
    
    // تغيير نوع البلاغ
    if (reportTypes.length > 0) {
        reportTypes.forEach(type => {
            type.addEventListener('click', () => {
                reportTypes.forEach(t => t.classList.remove('active'));
                type.classList.add('active');
                
                // إذا كان البلاغ عاجلاً، عرض خيار البث المباشر
                if (type.dataset.type === 'emergency') {
                    showLiveStreamOption();
                } else {
                    hideLiveStreamOption();
                }
            });
        });
    }
}

// ========== تهيئة التطبيق ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    checkRequiredElements();
    updateAuthUI();
    
    // التحقق من وجود بيانات مستخدم محفوظة
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        try {
            const userData = JSON.parse(savedUserData);
            // التحقق من صحة البيانات قبل استخدامها
            if (userData && userData.name && userData.name.trim() !== '') {
                isLoggedIn = true;
                currentUsername = userData.name;
                updateAuthUI();
            } else {
                // إذا كانت البيانات غير صالحة، احذفها
                localStorage.removeItem('userData');
            }
        } catch (error) {
            // إذا كان هناك خطأ في parsing، احذف البيانات التالفة
            localStorage.removeItem('userData');
            console.error('Error parsing user data:', error);
        }
    }
    
    // تطبيق إعدادات إمكانية الوصول المحفوظة
    applyAccessibilitySettings();
    
    // إضافة مستمع لتسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // تهيئة الخريطة
    initMap();
    
    // تهيئة الأسئلة الشائعة
    setupFAQ();
    
    // التحقق مما إذا كانت هذه هي المرة الأولى للمستخدم
    checkFirstTimeUser();
    
    // تهيئة البث المباشر
    initLiveStreaming();
    
    // تهيئة رفع الملفات
    initFileUpload();
    
    // تهيئة إرسال البلاغات
    initReportSubmission();
    
    // تحديث قائمة البلاغات
    updateReportsList();
    
    // إضافة مستمعي الأحداث
    setupEventListeners();

    // تهيئة معاينة PDF
    initPDFPreview();

    appState.isInitialized = true;
}

function checkRequiredElements() {
    const requiredElements = {
        loginBtn: 'زر تسجيل الدخول',
        mapContainer: 'حاوية الخريطة',
        chatbotMessages: 'حاوية رسائل الشات بوت'
    };
    
    for (const [id, name] of Object.entries(requiredElements)) {
        if (!document.getElementById(id)) {
            console.warn(`عنصر ${name} (${id}) غير موجود في الصفحة`);
        }
    }
}

// ========== تطبيق إعدادات إمكانية الوصول ==========
function applyAccessibilitySettings() {
    // تطبيق حجم الخط
    document.body.classList.remove('text-small', 'text-normal', 'text-large', 'text-xlarge');
    if (accessibilitySettings.fontSize !== 'normal') {
        document.body.classList.add(`text-${accessibilitySettings.fontSize}`);
    }
    
    // تطبيق التباين العالي
    document.body.classList.toggle('high-contrast', accessibilitySettings.highContrast);
    
    // تطبيق القارئ الصوتي
    if (textToSpeechToggle && textToSpeechToggle instanceof HTMLInputElement) {
        textToSpeechToggle.checked = accessibilitySettings.textToSpeech;
        if (accessibilitySettings.textToSpeech) {
            initTextToSpeech();
        }
    }
    
    // تحديث عناصر واجهة المستخدم
    if (fontSizeSelect) {
        fontSizeSelect.value = accessibilitySettings.fontSize;
    }
    if (highContrastToggle && highContrastToggle instanceof HTMLInputElement) {
        highContrastToggle.checked = accessibilitySettings.highContrast;
    }
}

// ========== إعداد مستمعي الأحداث ==========
function setupEventListeners() {
    // أحداث نظام المصادقة
    if (loginBtn) loginBtn.addEventListener('click', () => loginContainer.style.display = 'flex');
    if (registerBtn) registerBtn.addEventListener('click', () => registerContainer.style.display = 'flex');
    if (closeLogin) closeLogin.addEventListener('click', () => loginContainer.style.display = 'none');
    if (closeRegister) closeRegister.addEventListener('click', () => registerContainer.style.display = 'none');
    if (closeForgotPassword) closeForgotPassword.addEventListener('click', () => forgotPasswordContainer.style.display = 'none');
    
    if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'flex';
    });
    
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
    });
    
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        forgotPasswordContainer.style.display = 'flex';
    });
    
    if (backToLogin) backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
    });
    
    // معالجة تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // معالجة إنشاء حساب
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // معالجة استعادة كلمة المرور
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // أحداث التنقل
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            changePage(pageId);
        });
    });
    
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            changePage('home');
        });
    }
    
    // القائمة المتحركة للهواتف
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // أحداث الإبلاغ
    if (heroReportBtn) {
        heroReportBtn.addEventListener('click', () => {
            if (!isLoggedIn) {
                showNotification('يجب تسجيل الدخول أولاً للإبلاغ عن حالة', 'error');
                loginContainer.style.display = 'flex';
                return;
            }
            reportContainer.style.display = 'flex';
        });
    }
    
    if (pageReportBtn) {
        pageReportBtn.addEventListener('click', () => {
            if (!isLoggedIn) {
                showNotification('يجب تسجيل الدخول أولاً للإبلاغ عن حالة', 'error');
                loginContainer.style.display = 'flex';
                return;
            }
            reportContainer.style.display = 'flex';
        });
    }
    
    if (closeReport) {
        closeReport.addEventListener('click', () => {
            reportContainer.style.display = 'none';
            // إخفاء الخريطة عند إغلاق النموذج
            if (mapContainer) mapContainer.style.display = 'none';
        });
    }
    
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmission);
    }
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', handleOutsideClick);
    
    // أحداث الجولة التعريفية المحسنة
    if (tourLauncher) tourLauncher.addEventListener('click', startTour);
    if (tourSkip) tourSkip.addEventListener('click', skipTour);
    if (tourPrev) tourPrev.addEventListener('click', prevStep);
    if (tourNext) tourNext.addEventListener('click', nextStep);
    if (tourFinish) tourFinish.addEventListener('click', finishTour);
    
    // أحداث الشات بوت
    if (chatbotToggle) chatbotToggle.addEventListener('click', toggleChatbot);
    if (closeChatbot) closeChatbot.addEventListener('click', () => chatbotWindow.style.display = 'none');
    if (sendMessage) sendMessage.addEventListener('click', sendChatMessage);
    if (chatbotInput) chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // تسجيل الصوت في الشات بوت
    if (chatVoiceRecord) chatVoiceRecord.addEventListener('click', toggleVoiceRecording);
    
    // إرفاق الملفات في الشات بوت
    if (chatAttachment) chatAttachment.addEventListener('click', attachFile);
    
    // إدارة إمكانية الوصول
    if (accessibilityBtn) accessibilityBtn.addEventListener('click', toggleAccessibilityPanel);
    if (fontSizeSelect) fontSizeSelect.addEventListener('change', changeFontSize);
    if (highContrastToggle) highContrastToggle.addEventListener('change', toggleHighContrast);
    if (textToSpeechToggle) textToSpeechToggle.addEventListener('change', toggleTextToSpeech);
    
    // فحص قوة كلمة المرور
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // فحص الأمان - تحديث: إضافة مستمع للزر في الصفحة الرئيسية
    if (securityCheckBtn) {
        securityCheckBtn.addEventListener('click', handleSecurityCheck);
    }
    
    // فحص الأمان - تحديث: إضافة مستمع للزر في صفحة فحص الأمان
    const pageSecurityCheckBtn = document.getElementById('pageSecurityCheckBtn');
    const pageSecurityCheckInput = document.getElementById('pageSecurityCheckInput');
    
    if (pageSecurityCheckBtn) {
        pageSecurityCheckBtn.addEventListener('click', handlePageSecurityCheck);
    }
    
    if (pageSecurityCheckInput) {
        pageSecurityCheckInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handlePageSecurityCheck();
            }
        });
    }
    
    // إدارة عرض/إخفاء كلمة المرور
    setupPasswordToggle();
    
    // أحداث تحديد الموقع - الجديدة
    if (detectLocation) {
        detectLocation.addEventListener('click', getCurrentLocation);
    }
    
    // إضافة اختصارات لوحة المفاتيح
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ========== نظام فحص الأمان  ==========
async function handleSecurityCheck() {
    const input = securityCheckInput ? securityCheckInput.value.trim() : '';
    if (!input) {
        showNotification('يرجى إدخال رابط أو اسم ملف للفحص', 'error');
        return;
    }
    
    if (securityCheckResult) {
        securityCheckResult.style.display = 'block';
        securityCheckResult.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div> جاري الفحص المتقدم...';
        securityCheckResult.className = 'security-check-result';
    }
    
    try {
        const result = await checkSecurityEnhanced(input);
        if (securityCheckResult) {
            securityCheckResult.innerHTML = result.message;
            
            // إضافة فئة حسب مستوى التهديد
            if (result.threatLevel === "critical") {
                securityCheckResult.classList.add('danger');
            } else if (result.threatLevel === "high" || result.threatLevel === "medium") {
                securityCheckResult.classList.add('warning');
            } else if (result.threatLevel === "safe") {
                securityCheckResult.classList.add('safe');
            } else {
                securityCheckResult.classList.add('warning');
            }
            
            // إضافة تفاصيل إضافية إذا كانت موجودة
            if (result.details && result.details.length > 0) {
                const detailsHtml = result.details.map(detail => 
                    `<div style="margin-top: 8px; font-size: 12px; color: #666;">• ${detail}</div>`
                ).join('');
                securityCheckResult.innerHTML += detailsHtml;
            }
        }
    } catch (error) {
        if (securityCheckResult) {
            securityCheckResult.innerHTML = '❌ حدث خطأ أثناء الفحص. يرجى المحاولة مرة أخرى.';
            securityCheckResult.classList.add('danger');
        }
    }
}

//  دالة فحص الأمان لصفحة فحص الأمان
async function handlePageSecurityCheck() {
    const pageSecurityCheckInput = document.getElementById('pageSecurityCheckInput');
    const pageSecurityCheckResult = document.getElementById('pageSecurityCheckResult');
    
    const input = pageSecurityCheckInput ? pageSecurityCheckInput.value.trim() : '';
    if (!input) {
        showNotification('يرجى إدخال رابط أو اسم ملف للفحص', 'error');
        return;
    }
    
    if (pageSecurityCheckResult) {
        pageSecurityCheckResult.style.display = 'block';
        pageSecurityCheckResult.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div> جاري الفحص المتقدم...';
        pageSecurityCheckResult.className = 'security-check-result';
    }
    
    try {
        const result = await checkSecurityEnhanced(input);
        if (pageSecurityCheckResult) {
            pageSecurityCheckResult.innerHTML = result.message;
            pageSecurityCheckResult.classList.add(result.safe ? 'safe' : result.warning ? 'warning' : 'danger');
        }
    } catch (error) {
        if (pageSecurityCheckResult) {
            pageSecurityCheckResult.innerHTML = '❌ حدث خطأ أثناء الفحص. يرجى المحاولة مرة أخرى.';
            pageSecurityCheckResult.classList.add('danger');
        }
    }
}

// ========== تحديد الموقع والخريطة   ==========
function initMap() {
    if (!mapContainer) {
        console.warn('حاوية الخريطة غير موجودة');
        return;
    }
    
    // إخفاء الخريطة في البداية
    mapContainer.style.display = 'none';
    
    // إنشاء عنصر نائب إذا لم يكن موجوداً
    if (!mapPlaceholder) {
        const placeholder = document.createElement('div');
        placeholder.id = 'mapPlaceholder';
        placeholder.className = 'map-placeholder';
        placeholder.innerHTML = `
            <h3>الخريطة غير متاحة حالياً</h3>
            <p>انقر على زر "تحديد موقعي الحالي" لتحميل الخريطة</p>
        `;
        mapContainer.appendChild(placeholder);
    } else {
        mapPlaceholder.style.display = 'flex';
    }
}

    // تحديد الموقع  
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('متصفحك لا يدعم خاصية تحديد الموقع', 'error');
        return;
    }
    
    // تعطيل الزر أثناء المعالجة
    if (detectLocation) {
        detectLocation.disabled = true;
        detectLocation.textContent = 'جاري تحديد الموقع...';
    }
    
    showNotification('جاري تحديد موقعك...', 'info');
    
    // خيارات إضافية لطلب الموقع
    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 ثواني
        maximumAge: 60000 // دقيقة واحدة
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // إخفاء العنصر النائب وإظهار الخريطة
            if (mapPlaceholder) mapPlaceholder.style.display = 'none';
            if (mapContainer) mapContainer.style.display = 'block';
            
            // تهيئة الخريطة إذا لم تكن مهيأة
            if (!map) {
                try {
                    map = L.map('map').setView([lat, lng], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 18
                    }).addTo(map);
                } catch (error) {
                    showNotification('خطأ في تحميل الخريطة: ' + error.message, 'error');
                    if (detectLocation) {
                        detectLocation.disabled = false;
                        detectLocation.textContent = 'تحديد موقعي الحالي';
                    }
                    return;
                }
            } else {
                map.setView([lat, lng], 15);
            }
            
            // إضافة أو تحديث العلامة
            if (userMarker) {
                userMarker.setLatLng([lat, lng]);
            } else {
                userMarker = L.marker([lat, lng]).addTo(map);
                userMarker.bindPopup("موقعك الحالي").openPopup();
            }
            
            // الحصول على اسم الموقع
            fetchLocationName(lat, lng);
        },
        (error) => {
            let errorMessage = 'تعذر تحديد موقعك. يرجى إدخاله يدوياً.';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'تم رفض طلب الوصول إلى الموقع. يرجى السماح بالوصول إلى الموقع في إعدادات المتصفح.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'معلومات الموقع غير متاحة.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'انتهت مهلة طلب الموقع.';
                    break;
            }
            
            showNotification(errorMessage, 'error');
            
            // إعادة تمكين الزر
            if (detectLocation) {
                detectLocation.disabled = false;
                detectLocation.textContent = 'تحديد موقعي الحالي';
            }
        },
        options
    );
}

// جلب اسم الموقع من الإحداثيات - دالة جديدة
function fetchLocationName(lat, lng) {
    // استخدام Nominatim API للحصول على اسم الموقع
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في جلب اسم الموقع');
            }
            return response.json();
        })
        .then(data => {
            const locationName = data.display_name || `خط العرض: ${lat}, خط الطول: ${lng}`;
            if (reportLocation) {
                reportLocation.value = locationName;
            }
            showNotification('تم تحديد موقعك بنجاح', 'success');
        })
        .catch(error => {
            console.error('Error fetching location name:', error);
            if (reportLocation) {
                reportLocation.value = `خط العرض: ${lat.toFixed(6)}, خط الطول: ${lng.toFixed(6)}`;
            }
            showNotification('تم تحديد الموقع لكن تعذر الحصول على اسم المكان', 'info');
        })
        .finally(() => {
            // إعادة تمكين الزر بعد اكتمال العملية
            if (detectLocation) {
                detectLocation.disabled = false;
                detectLocation.textContent = 'تحديث موقعي';
            }
        });
}

// ========== نظام المصادقة ==========
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (validateLogin(email, password)) {
        loginUser(email);
        loginContainer.style.display = 'none';
        showNotification('تم تسجيل الدخول بنجاح!', 'success');
    } else {
        showNotification('يرجى التحقق من البيانات المدخلة', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('registerPhone').value;
    const nationalId = document.getElementById('registerNationalId').value;
    
    if (validateRegister(name, email, password, confirmPassword, phone, nationalId)) {
        registerUser(name, email, phone, nationalId);
        registerContainer.style.display = 'none';
        showNotification('تم إنشاء الحساب بنجاح!', 'success');
    } else {
        showNotification('يرجى التحقق من البيانات المدخلة', 'error');
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotPasswordEmail').value;
    
    if (validateEmail(email)) {
        showNotification('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
        forgotPasswordContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
    } else {
        showNotification('يرجى إدخال بريد إلكتروني صحيح', 'error');
    }
}

// وظائف التحقق من الصحة
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 8;
}

function validateLogin(email, password) {
    return validateEmail(email) && password.length >= 8;
}

function validateRegister(name, email, password, confirmPassword, phone, nationalId) {
    return name.length >= 3 && 
           validateEmail(email) && 
           validatePassword(password) && 
           password === confirmPassword && 
           phone.length >= 10 &&
           nationalId.length >= 14;
}

// وظائف المستخدم
function loginUser(email) {
    isLoggedIn = true;
    currentUsername = email.split('@')[0];
    updateAuthUI();
}

function registerUser(name, email, phone, nationalId) {
    isLoggedIn = true;
    currentUsername = name;
    updateAuthUI();
    
    // حفظ بيانات المستخدم
    const userData = {
        name: name,
        email: email,
        phone: phone,
        nationalId: nationalId,
        joinDate: new Date().toISOString()
    };
    localStorage.setItem('userData', JSON.stringify(userData));
}

function logoutUser() {
    isLoggedIn = false;
    currentUsername = "";
    
    // إضافة هذه الأسطر لمسح البيانات المحفوظة
    localStorage.removeItem('userData');
    
    updateAuthUI();
    showNotification('تم تسجيل الخروج بنجاح', 'info');
}

function updateAuthUI() {
    if (isLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = 'مرحباً، ' + currentUsername;
        
        // تحديث قائمة البلاغات عند تسجيل الدخول
        updateReportsList();
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (registerBtn) registerBtn.style.display = 'inline-flex';
        if (userInfo) userInfo.style.display = 'none';
        
        // إخفاء البلاغات عند تسجيل الخروج
        updateReportsList();
    }
}

// التنقل بين الصفحات
function changePage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    if (navMenu) {
        navMenu.classList.remove('active');
    }
}

// ========== الشات بوت ==========
function toggleChatbot() {
    if (chatbotWindow) {
        chatbotWindow.style.display = chatbotWindow.style.display === 'flex' ? 'none' : 'flex';
    }
}

async function toggleVoiceRecording() {
    if (isRecording) {
        await stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('المتصفح لا يدعم التسجيل الصوتي');
        }

        showNotification('جاري تفعيل تسجيل الصوت...', 'info');
        
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        currentStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        mediaRecorder = new MediaRecorder(currentStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { 
                type: mediaRecorder.mimeType || 'audio/webm' 
            });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            addMessageToChat('', 'user', [], null, audioUrl);
            showNotification('تم إرسال التسجيل', 'success');
            
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            currentStream = null;
            isRecording = false;
            if (chatVoiceRecord) {
                chatVoiceRecord.innerHTML = '<i class="fas fa-microphone"></i>';
                chatVoiceRecord.setAttribute('aria-label', 'بدء التسجيل الصوتي');
            }
        };

        mediaRecorder.start();
        isRecording = true;
        if (chatVoiceRecord) {
            chatVoiceRecord.innerHTML = '<i class="fas fa-stop"></i>';
            chatVoiceRecord.setAttribute('aria-label', 'إيقاف التسجيل الصوتي');
        }
        showNotification('جاري التسجيل... انقر للإيقاف', 'info');

    } catch (error) {
        console.error('خطأ في التسجيل:', error);
        showNotification('تعذر الوصول إلى الميكروفون', 'error');
        isRecording = false;
        if (chatVoiceRecord) {
            chatVoiceRecord.innerHTML = '<i class="fas fa-microphone"></i>';
            chatVoiceRecord.setAttribute('aria-label', 'بدء التسجيل الصوتي');
        }
    }
}

async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    isRecording = false;
    if (chatVoiceRecord) {
        chatVoiceRecord.innerHTML = '<i class="fas fa-microphone"></i>';
        chatVoiceRecord.setAttribute('aria-label', 'بدء التسجيل الصوتي');
    }
}

function attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            addMessageToChat(`تم إرفاق الملف: ${file.name}`, 'user');
        }
    };
    input.click();
}

function sendChatMessage() {
    const message = chatbotInput ? chatbotInput.value.trim() : '';
    if (message) {
        addMessageToChat(message, 'user');
        if (chatbotInput) chatbotInput.value = '';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chatbot-typing');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        if (chatbotMessages) {
            chatbotMessages.appendChild(typingIndicator);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
        
        setTimeout(() => {
            if (chatbotMessages) chatbotMessages.removeChild(typingIndicator);
            
            let response = "";
            let options = [];
            
            if (message.includes('بلاغ') || message.includes('إبلاغ') || message.includes('أبلغ')) {
                response = "للتقديم على بلاغ، يرجى تسجيل الدخول أولاً ثم النقر على زر 'الإبلاغ عن حالة' في الأعلى أو في الصفحة الرئيسية. هل تريد المساعدة في شيء آخر؟";
                options = ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي'];
            } else if (message.includes('تنمر') || message.includes('تحرش') || message.includes('ابتزاز')) {
                response = "أنا آسف لسماع أنك تواجه هذه المشكلة. يمكنني مساعدتك في تقديم بلاغ رسمي أو توجيهك إلى الجهات المختصة. هل تريد البدء في عملية الإبلاغ؟";
                options = ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي'];
            } else if (message.includes('مساعدة') || message.includes('مساعده') || message.includes('مساعدة')) {
                response = "يمكنني مساعدتك في: الإبلاغ عن حالات التنمر والتحرش، تقديم معلومات عن الجهات الداعمة، الإجابة على استفساراتك. ما هي المساعدة التي تحتاجها بالتحديد؟";
                options = ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي'];
            } else if (message.includes('رقم') || message.includes('هاتف') || message.includes('اتصال')) {
                response = "يمكنك الاتصال بأرقام الطوارئ الظاهرة على الموقع: الشرطة (122)، الإسعاف (123)، المركز القومي للطفولة (16000)، خط مساعدة مكافحة التنمر (16528).";
                options = ['أرقام الطوارئ', 'كيف أقدم بلاغ؟', 'الدعم النفسي'];
            } else if (message.includes('دعم') || message.includes('نفسي') || message.includes('الإستشاري المتخصص')) {
                response = "نوفر خدمات الدعم النفسي من خلال مستشارين متخصصين على مدار الساعة. يمكنك طلب التحدث مع مستشار بالنقر على زر 'التحدث مع الإستشاري المتخصص' في الصفحة الرئيسية.";
                options = ['الدعم النفسي', 'كيف أقدم بلاغ؟', 'أرقام الطوارئ'];
            } else if (message.includes('بث') || message.includes('مباشر')) {
                response = "خاصية البث المباشر متاحة للبلاغات العاجلة فقط. عند تقديم بلاغ عاجل، سيتم تفعيل البث المباشر تلقائياً لتوثيق الواقعة في الوقت الفعلي.";
                options = ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي'];
            } else {
                response = "أنا هنا لمساعدتك في أي استفسار يتعلق بالتنمر أو التحرش. يمكنني مساعدتك في تقديم بلاغ، أو إرشادك إلى جهات الدعم، أو الإجابة على أسئلتك. كيف يمكنني مساعدتك؟";
                options = ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي'];
            }
            
            addMessageToChat(response, 'bot', options);
        }, 1500);
    }
}

function addOptionsToChat(options) {
    const optionsContainer = document.createElement('div');
    optionsContainer.classList.add('chatbot-options');
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('chatbot-option');
        button.textContent = option;
        button.setAttribute('data-option', option);
        button.addEventListener('click', () => {
            addMessageToChat(option, 'user');
            
            setTimeout(() => {
                let response = "";
                if (option === 'كيف أقدم بلاغ؟') {
                    response = "للتقديم على بلاغ، يرجى تسجيل الدخول أولاً ثم النقر على زر 'الإبلاغ عن حالة' في الأعلى أو في الصفحة الرئيسية. ستجد هناك نموذجاً مفصلاً لتعبئة البيانات المطلوبة.";
                } else if (option === 'أرقام الطوارئ') {
                    response = "أرقام الطوارئ الهامة: الشرطة (122)، الإسعاف (123)، المركز القومي للطفولة (16000)، خط مساعدة مكافحة التنمر (16528). لا تتردد في الاتصال بهم في الحالات الطارئة.";
                } else if (option === 'الدعم النفسي') {
                    response = "نوفر خدمات الدعم النفسي من خلال مستشارين متخصصين على مدار الساعة. يمكنك طلب التحدث مع مستشار بالنقر على زر 'التحدث مع الإستشاري المتخصص' في الصفحة الرئيسية.";
                }
                
                addMessageToChat(response, 'bot', ['كيف أقدم بلاغ؟', 'أرقام الطوارئ', 'الدعم النفسي']);
            }, 500);
        });
        
        optionsContainer.appendChild(button);
    });
    
    return optionsContainer;
}

function addMessageToChat(message, sender, options = [], image = null, audio = null) {
    if (!chatbotMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    if (image) {
        const imgElement = document.createElement('img');
        imgElement.src = image;
        imgElement.style.maxWidth = '100%';
        imgElement.style.borderRadius = '10px';
        imgElement.style.marginBottom = '10px';
        messageElement.appendChild(imgElement);
    }
    
    if (audio) {
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.src = audio;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        messageElement.appendChild(audioElement);
    }
    
    if (message) {
        const messageText = document.createElement('div');
        messageText.textContent = message;
        messageElement.appendChild(messageText);
    }
    
    const messageTime = document.createElement('div');
    messageTime.classList.add('message-time');
    messageTime.textContent = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    messageElement.appendChild(messageTime);
    
    if (sender === 'bot' && options.length > 0) {
        const optionsContainer = addOptionsToChat(options);
        messageElement.appendChild(optionsContainer);
    }
    
    chatbotMessages.appendChild(messageElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    if (sender === 'bot' && message && textToSpeechToggle && textToSpeechToggle.checked) {
        speakText(message);
    }
}

// ========== إمكانية الوصول ==========
function toggleAccessibilityPanel() {
    if (accessibilityPanel) {
        const isVisible = accessibilityPanel.style.display === 'block';
        accessibilityPanel.style.display = isVisible ? 'none' : 'block';
    }
}

function changeFontSize(e) {
    const newSize = e.target.value;
    accessibilitySettings.fontSize = newSize;
    
    // إزالة جميع فئات الأحجام السابقة
    document.body.classList.remove('text-small', 'text-normal', 'text-large', 'text-xlarge');
    
    // إضافة الفئة الجديدة إذا لم تكن "عادي"
    if (newSize !== 'normal') {
        document.body.classList.add(`text-${newSize}`);
    }
    
    // إعادة تطبيق إعدادات إمكانية الوصول
    applyAccessibilitySettings();
    
    // حفظ الإعدادات
    saveAccessibilitySettings();
    
    // إظهار إشعار تأكيد
    showNotification(`تم تغيير حجم الخط إلى ${getFontSizeName(newSize)}`, 'success');
}

function toggleHighContrast(e) {
    const isEnabled = e.target.checked;
    accessibilitySettings.highContrast = isEnabled;
    
    // تطبيق التباين العالي
    document.body.classList.toggle('high-contrast', isEnabled);
    
    // حفظ الإعدادات
    saveAccessibilitySettings();
    
    // إظهار إشعار تأكيد
    showNotification(`تم ${isEnabled ? 'تفعيل' : 'إيقاف'} وضع التباين العالي`, 'success');
}

let selectedVoice = null;

function toggleTextToSpeech(e) {
    const isEnabled = e.target.checked;
    accessibilitySettings.textToSpeech = isEnabled;
    
    if (isEnabled) {
        if (initTextToSpeech()) {
            showNotification('تم تفعيل القارئ الصوتي', 'success');
            // قراءة رسالة ترحيبية
            speakText('تم تفعيل خاصية القراءة الصوتية. سيتم الآن قراءة النصوص المهمة تلقائياً.');
        }
    } else {
        if (speechSynthesis) {
            speechSynthesis.cancel();
        }
        showNotification('تم إيقاف القارئ الصوتي', 'info');
    }
    
    // حفظ الإعدادات
    saveAccessibilitySettings();
}

function initTextToSpeech() {
    if ('speechSynthesis' in window) {
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            selectedVoice = voices.find(v => v.lang.startsWith('ar')) || voices[0];
        };

        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;

        return true;
    } else {
        showNotification('المتصفح لا يدعم القارئ الصوتي', 'error');
        return false;
    }
}

function speakText(text) {
    if (!('speechSynthesis' in window) || !accessibilitySettings.textToSpeech) {
        return;
    }

    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice?.lang || 'ar-SA';
    utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => {
        console.log("انتهى الكلام");
    };

    speechSynthesis.speak(utterance);
}

// وظائف مساعدة لإمكانية الوصول
function saveAccessibilitySettings() {
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
}

function getFontSizeName(size) {
    const sizes = {
        'small': 'صغير',
        'normal': 'عادي',
        'large': 'كبير',
        'xlarge': 'كبير جداً'
    };
    return sizes[size] || 'عادي';
}

// ========== فحص قوة كلمة المرور ==========
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength += 1;
    else feedback.push('كلمة المرور قصيرة (8 أحرف على الأقل)');
    
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    else feedback.push('تتضمن أحرف كبيرة وصغيرة');
    
    if (/[0-9]/.test(password)) strength += 1;
    else feedback.push('تتضمن أرقاماً');
    
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    else feedback.push('تتضمن رموزاً خاصة');
    
    updatePasswordStrengthUI(strength, feedback, password.length);
}

function updatePasswordStrengthUI(strength, feedback, length) {
    if (!passwordStrength || !passwordFeedback) return;
    
    const strengthClasses = ['weak', 'medium', 'strong', 'very-strong'];
    const strengthText = ['ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'];
    const strengthColors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff'];
    
    if (length === 0) {
        passwordStrength.style.width = '0%';
        passwordStrength.className = 'strength-meter-fill';
        passwordFeedback.textContent = '';
        passwordFeedback.style.display = 'none';
        return;
    }
    
    const strengthIndex = Math.min(strength, 3);
    const width = ((strengthIndex + 1) / 4) * 100;
    
    passwordStrength.style.width = width + '%';
    passwordStrength.className = 'strength-meter-fill ' + strengthClasses[strengthIndex];
    passwordStrength.style.backgroundColor = strengthColors[strengthIndex];
    
    if (strength < 3) {
        passwordFeedback.textContent = 'نصائح: ' + feedback.join('، ');
        passwordFeedback.style.color = strengthColors[strengthIndex];
        passwordFeedback.style.display = 'block';
    } else {
        passwordFeedback.textContent = '✓ كلمة المرور قوية';
        passwordFeedback.style.color = strengthColors[strengthIndex];
        passwordFeedback.style.display = 'block';
    }
}

// إدارة عرض/إخفاء كلمة المرور
function setupPasswordToggle() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
        const container = field.parentElement;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = `
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
        `;
        
        container.style.position = 'relative';
        container.appendChild(toggleBtn);
        
        toggleBtn.addEventListener('click', () => {
            if (field.type === 'password') {
                field.type = 'text';
                toggleBtn.innerHTML = '🙈';
            } else {
                field.type = 'password';
                toggleBtn.innerHTML = '👁️';
            }
        });
    });
}

// بدء البث المباشر
async function startLiveStream() {
    try {
        showNotification('جاري تهيئة البث المباشر...', 'info');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        const liveStreamVideo = document.getElementById('liveStreamVideo');
        const liveStreamContainer = document.getElementById('liveStreamContainer');
        
        liveStreamVideo.srcObject = stream;
        liveStream = stream;
        
        // بدء التسجيل
        recordedChunks = [];
        liveStreamMediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9,opus'
        });
        
        liveStreamMediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        liveStreamMediaRecorder.start(1000); // تسجيل كل ثانية
        
        liveStreamContainer.style.display = 'flex';
        showNotification('تم بدء البث المباشر بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في البث المباشر:', error);
        showNotification('تعذر الوصول إلى الكاميرا أو الميكروفون', 'error');
    }
}

// إيقاف البث المباشر
function stopLiveStream() {
    if (liveStreamMediaRecorder && liveStreamMediaRecorder.state === 'recording') {
        liveStreamMediaRecorder.stop();
    }
    
    if (liveStream) {
        liveStream.getTracks().forEach(track => track.stop());
        liveStream = null;
    }
    
    const liveStreamContainer = document.getElementById('liveStreamContainer');
    if (liveStreamContainer) {
        liveStreamContainer.style.display = 'none';
    }
    
    // حفظ التسجيل
    if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // إضافة التسجيل إلى الملفات المرفقة
        attachedFiles.push({
            name: `live_stream_${Date.now()}.webm`,
            type: 'video/webm',
            blob: blob,
            url: url
        });
        
        updateFilePreview();
        showNotification('تم حفظ تسجيل البث المباشر', 'success');
    }
}

// إلغاء البث المباشر
function cancelLiveStream() {
    if (liveStreamMediaRecorder && liveStreamMediaRecorder.state === 'recording') {
        liveStreamMediaRecorder.stop();
    }
    
    if (liveStream) {
        liveStream.getTracks().forEach(track => track.stop());
        liveStream = null;
    }
    
    const liveStreamContainer = document.getElementById('liveStreamContainer');
    if (liveStreamContainer) {
        liveStreamContainer.style.display = 'none';
    }
    
    recordedChunks = [];
    showNotification('تم إلغاء البث المباشر', 'info');
}

// معالجة الملفات المرفقة
function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // التحقق من حجم الملف (10MB كحد أقصى)
        if (file.size > 10 * 1024 * 1024) {
            showNotification(`الملف ${file.name} كبير جداً (الحد الأقصى 10MB)`, 'error');
            continue;
        }
        
        // التحقق من نوع الملف
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!allowedTypes.includes(file.type)) {
            showNotification(`نوع الملف ${file.name} غير مدعوم`, 'error');
            continue;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            attachedFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                blob: file
            });
            
            updateFilePreview();
            showNotification(`تم إرفاق الملف: ${file.name}`, 'success');
        };
        
        reader.readAsDataURL(file);
    }
}

//  معاينة الملفات
function updateFilePreview() {
    const filePreview = document.getElementById('filePreview');
    
    if (!filePreview) return;
    
    filePreview.innerHTML = '';
    
    attachedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        if (file.type.startsWith('image/')) {
            fileItem.innerHTML = `
                <img src="${file.data}" alt="${file.name}">
                <div class="file-info">
                    <span>${file.name}</span>
                    <button onclick="removeFile(${index})" class="remove-file-btn">×</button>
                </div>
            `;
        } else if (file.type.startsWith('video/')) {
            fileItem.innerHTML = `
                <video controls>
                    <source src="${file.data}" type="${file.type}">
                    المتصفح لا يدعم تشغيل الفيديو
                </video>
                <div class="file-info">
                    <span>${file.name}</span>
                    <button onclick="removeFile(${index})" class="remove-file-btn">×</button>
                </div>
            `;
        } else {
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="file-info">
                    <span>${file.name}</span>
                    <button onclick="removeFile(${index})" class="remove-file-btn">×</button>
                </div>
            `;
        }
        
        filePreview.appendChild(fileItem);
    });
}

// إزالة ملف مرفق
function removeFile(index) {
    attachedFiles.splice(index, 1);
    updateFilePreview();
    showNotification('تم إزالة الملف', 'info');
}

// عرض خيار البث المباشر للبلاغات العاجلة
function showLiveStreamOption() {
    const liveStreamOption = document.getElementById('liveStreamOption');
    if (liveStreamOption) {
        liveStreamOption.style.display = 'block';
    }
}

// إخفاء خيار البث المباشر
function hideLiveStreamOption() {
    const liveStreamOption = document.getElementById('liveStreamOption');
    if (liveStreamOption) {
        liveStreamOption.style.display = 'none';
    }
}

// معالجة إرسال البلاغ
function handleReportSubmission(e) {
    if (e) e.preventDefault();
    
    if (!isLoggedIn) {
        showNotification('يجب تسجيل الدخول أولاً لتقديم بلاغ', 'error');
        loginContainer.style.display = 'flex';
        return;
    }
    
    const reportType = document.querySelector('.report-type.active')?.dataset.type;
    const reportCategory = document.getElementById('reportType').value;
    const reportDetails = document.getElementById('reportDetails').value;
    const reportLocation = document.getElementById('reportLocation').value;
    const reportDate = document.getElementById('reportDate').value;
    
    if (!reportCategory || !reportDetails) {
        showNotification('يرجى ملء جميع الحقول الإلزامية', 'error');
        return;
    }
    
    // إنشاء كائن البلاغ
    const report = {
        id: Date.now(),
        type: reportType || 'normal',
        category: reportCategory,
        details: reportDetails,
        location: reportLocation,
        date: reportDate || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: reportType === 'emergency' ? 'عاجل' : 'جديد',
        user: currentUsername,
        files: attachedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
        })),
        hasLiveStream: reportType === 'emergency' && recordedChunks.length > 0
    };
    
    // إضافة البلاغ إلى القائمة
    userReports.push(report);
    localStorage.setItem('userReports', JSON.stringify(userReports));
    
    // إظهار رسالة نجاح
    showNotification('تم تقديم البلاغ بنجاح وسيتم مراجعته قريباً', 'success');
    
    // إعادة تعيين النموذج
    resetReportForm();
    
    // إغلاق النموذج
    const reportContainer = document.getElementById('reportContainer');
    if (reportContainer) {
        reportContainer.style.display = 'none';
    }
    
    // تحديث قائمة البلاغات
    updateReportsList();
}

// إلغاء البلاغ
function cancelReport() {
    if (confirm('هل تريد إلغاء البلاغ؟ سيتم فقدان جميع البيانات المدخلة.')) {
        resetReportForm();
        
        const reportContainer = document.getElementById('reportContainer');
        if (reportContainer) {
            reportContainer.style.display = 'none';
        }
    }
}

// إعادة تعيين نموذج البلاغ
function resetReportForm() {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.reset();
    }
    
    // إعادة تعيين الملفات المرفقة
    attachedFiles = [];
    updateFilePreview();
    
    // إعادة تعيين البث المباشر
    if (liveStreamMediaRecorder && liveStreamMediaRecorder.state === 'recording') {
        liveStreamMediaRecorder.stop();
    }
    
    if (liveStream) {
        liveStream.getTracks().forEach(track => track.stop());
        liveStream = null;
    }
    
    recordedChunks = [];
    
    // إخفاء خيار البث المباشر
    hideLiveStreamOption();
    
    // إعادة تعيين نوع البلاغ إلى العادي
    const reportTypes = document.querySelectorAll('.report-type');
    reportTypes.forEach(type => {
        type.classList.remove('active');
        if (type.dataset.type === 'normal') {
            type.classList.add('active');
        }
    });
}

// ==========  قائمة البلاغات ==========
function updateReportsList() {
    const reportsList = document.getElementById('reportsList');
    const trackingReportsList = document.getElementById('trackingReportsList');
    
    // مسح القوائم أولاً
    if (reportsList) reportsList.innerHTML = '';
    if (trackingReportsList) trackingReportsList.innerHTML = '';
    
    // إذا لم يكن المستخدم مسجلاً، لا تعرض أي بلاغات
    if (!isLoggedIn) {
        if (reportsList) {
            reportsList.innerHTML = `
                <div class="no-reports-login">
                    <p>يجب تسجيل الدخول لعرض البلاغات السابقة</p>
                    <button class="btn btn-primary" onclick="loginContainer.style.display = 'flex'">
                        <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                    </button>
                </div>
            `;
        }
        if (trackingReportsList) {
            trackingReportsList.innerHTML = `
                <div class="no-reports-login">
                    <p>يجب تسجيل الدخول لمتابعة البلاغات</p>
                    <button class="btn btn-primary" onclick="loginContainer.style.display = 'flex'">
                        <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                    </button>
                </div>
            `;
        }
        return;
    }
    
    // إذا كان مسجلاً، اعرض فقط بلاغات المستخدم الحالي
    const userSpecificReports = userReports.filter(report => report.user === currentUsername);
    
    if (reportsList) {
        if (userSpecificReports.length === 0) {
            reportsList.innerHTML = '<div class="no-reports">لا توجد بلاغات سابقة</div>';
        } else {
            userSpecificReports.forEach(report => {
                const reportItem = document.createElement('div');
                reportItem.className = 'report-item';
                reportItem.innerHTML = `
                    <div class="report-header">
                        <h4>بلاغ #${report.id}</h4>
                        <span class="report-status ${report.status === 'عاجل' ? 'emergency' : 'normal'}">${report.status}</span>
                    </div>
                    <div class="report-details">
                        <p><strong>النوع:</strong> ${report.category}</p>
                        <p><strong>التاريخ:</strong> ${new Date(report.timestamp).toLocaleDateString('ar-EG')}</p>
                        <p><strong>الحالة:</strong> ${report.status}</p>
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-outline view-report-btn" data-id="${report.id}">عرض التفاصيل</button>
                    </div>
                `;
                
                reportsList.appendChild(reportItem);
            });
        }
    }
    
    if (trackingReportsList) {
        if (userSpecificReports.length === 0) {
            trackingReportsList.innerHTML = '<div class="no-reports">لا توجد بلاغات لمتابعتها</div>';
        } else {
            userSpecificReports.forEach(report => {
                const trackingItem = document.createElement('div');
                trackingItem.className = 'tracking-item';
                trackingItem.innerHTML = `
                    <div class="tracking-header">
                        <h4>بلاغ #${report.id}</h4>
                        <span class="tracking-status">${report.status}</span>
                    </div>
                    <div class="tracking-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${getProgressWidth(report.status)}%"></div>
                        </div>
                        <div class="progress-steps">
                            <span class="${report.status !== 'جديد' ? 'completed' : ''}">مستلم</span>
                            <span class="${report.status === 'قيد المعالجة' || report.status === 'مكتمل' ? 'completed' : ''}">قيد المعالجة</span>
                            <span class="${report.status === 'مكتمل' ? 'completed' : ''}">مكتمل</span>
                        </div>
                    </div>
                `;
                
                trackingReportsList.appendChild(trackingItem);
            });
        }
    }
}

// حساب عرض شريط التقدم بناءً على حالة البلاغ
function getProgressWidth(status) {
    switch(status) {
        case 'جديد': return 33;
        case 'قيد المعالجة': return 66;
        case 'مكتمل': return 100;
        case 'عاجل': return 25;
        default: return 0;
    }
}

// ========== الأسئلة الشائعة ==========
function setupFAQ() {
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        const otherIcon = otherItem.querySelector('.faq-icon');
                        if (otherAnswer) {
                            otherAnswer.style.display = 'none';
                            otherItem.classList.remove('active');
                            if (otherIcon) otherIcon.textContent = '+';
                        }
                    }
                });
                
                const icon = item.querySelector('.faq-icon');
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    item.classList.remove('active');
                    if (icon) icon.textContent = '+';
                } else {
                    answer.style.display = 'block';
                    item.classList.add('active');
                    if (icon) icon.textContent = '-';
                }
            });
        }
    });
}

// ========== معاينة PDF  ==========
function initPDFPreview() {
    // إضافة مستمعي الأحداث لمعاينة PDF
    const pdfPreviews = document.querySelectorAll('.pdf-preview');
    
    pdfPreviews.forEach(preview => {
        preview.addEventListener('click', function() {
            const pdfFile = this.getAttribute('data-pdf');
            const pdfTitle = this.closest('.pdf-item').querySelector('h4').textContent;
            openPDFViewer(pdfFile, pdfTitle);
        });
    });
    
    // إغلاق معاينة PDF
    if (closePdfViewer) {
        closePdfViewer.addEventListener('click', closePDFViewer);
    }
    
    if (closePdfBtn) {
        closePdfBtn.addEventListener('click', closePDFViewer);
    }
    
    // إغلاق بالنقر خارج النافذة
    if (pdfViewerContainer) {
        pdfViewerContainer.addEventListener('click', function(e) {
            if (e.target === this) {
                closePDFViewer();
            }
        });
    }
}

function openPDFViewer(pdfFile, title) {
    if (!pdfViewerContainer || !pdfFrame || !pdfViewerTitle || !pdfDownloadLink) {
        showNotification('تعذر فتح معاينة PDF', 'error');
        return;
    }
    
    // تعيين عنوان PDF
    pdfViewerTitle.textContent = title;
    
    // تعيين رابط التحميل
    pdfDownloadLink.href = pdfFile;
    pdfDownloadLink.download = pdfFile;
    
    // تحميل PDF في الإطار
    pdfFrame.src = pdfFile;
    
    // عرض النافذة
    pdfViewerContainer.style.display = 'flex';
    
    // إضافة تأثير ظهور
    setTimeout(() => {
        pdfViewerContainer.style.opacity = '1';
    }, 10);
}

function closePDFViewer() {
    if (!pdfViewerContainer) return;
    
    // إخفاء النافذة
    pdfViewerContainer.style.opacity = '0';
    
    setTimeout(() => {
        pdfViewerContainer.style.display = 'none';
        
        // إعادة تعيين الإطار
        if (pdfFrame) {
            pdfFrame.src = '';
        }
    }, 300);
}

// ========== تشغيل الفيديوهات  ==========
function getYouTubeVideoId(url) {
    if (!url) return null;
    
    // تنظيف الرابط وإزالة أي مسافات
    url = url.trim();
    
    // أنماط مختلفة لروابط YouTube
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
        /youtube\.com\/watch\?.*v=([^&?#]+)/,
        /youtu\.be\/([^&?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

function openVideo(youtubeUrl) {
    try {
        // استخراج ID الفيديو من الرابط
        const videoId = getYouTubeVideoId(youtubeUrl);
        
        if (!videoId) {
            showNotification('رابط الفيديو غير صحيح', 'error');
            return;
        }

        // إنشاء عنصر overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // إنشاء iframe للتشغيل
        const iframe = document.createElement('iframe');
        iframe.width = '90%';
        iframe.height = '80%';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = '10px';

        // زر الإغلاق
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            z-index: 10001;
        `;
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // إضافة العناصر إلى overlay
        overlay.appendChild(iframe);
        overlay.appendChild(closeBtn);

        // إضافة overlay إلى body
        document.body.appendChild(overlay);

        // إغلاق المشغل عند النقر خارج الفيديو
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    } catch (error) {
        console.error('Error playing video:', error);
        showNotification('عذراً، لا يمكن تشغيل الفيديو حالياً', 'error');
    }
}

// ========== وظائف المساعدة ==========
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function handleOutsideClick(e) {
    if (loginContainer && e.target === loginContainer) {
        loginContainer.style.display = 'none';
    }
    if (registerContainer && e.target === registerContainer) {
        registerContainer.style.display = 'none';
    }
    if (forgotPasswordContainer && e.target === forgotPasswordContainer) {
        forgotPasswordContainer.style.display = 'none';
    }
    if (reportContainer && e.target === reportContainer) {
        reportContainer.style.display = 'none';
        if (mapContainer) mapContainer.style.display = 'none';
    }
    if (tourContainer && e.target === tourContainer) {
        finishTour();
    }
    if (navMenu && !e.target.closest('#navMenu') && e.target !== navToggle) {
        navMenu.classList.remove('active');
    }
    if (accessibilityPanel && !e.target.closest('#accessibilityPanel') && e.target !== accessibilityBtn) {
        accessibilityPanel.style.display = 'none';
    }
}

// اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(e) {
    // Alt + 1: التبديل بين وضع التباين العالي
    if (e.altKey && e.key === '1') {
        e.preventDefault();
        if (highContrastToggle) {
            highContrastToggle.checked = !highContrastToggle.checked;
            toggleHighContrast({target: highContrastToggle});
        }
    }
    
    // Alt + 2: فتح/إغلاق لوحة إمكانية الوصول
    if (e.altKey && e.key === '2') {
        e.preventDefault();
        toggleAccessibilityPanel();
    }
    
    // Alt + 3: تكبير الخط
    if (e.altKey && e.key === '3') {
        e.preventDefault();
        if (fontSizeSelect) {
            const sizes = ['small', 'normal', 'large', 'xlarge'];
            const currentIndex = sizes.indexOf(fontSizeSelect.value);
            const newIndex = Math.min(currentIndex + 1, sizes.length - 1);
            fontSizeSelect.value = sizes[newIndex];
            changeFontSize({target: fontSizeSelect});
        }
    }
    
    // Alt + 4: تصغير الخط
    if (e.altKey && e.key === '4') {
        e.preventDefault();
        if (fontSizeSelect) {
            const sizes = ['small', 'normal', 'large', 'xlarge'];
            const currentIndex = sizes.indexOf(fontSizeSelect.value);
            const newIndex = Math.max(currentIndex - 1, 0);
            fontSizeSelect.value = sizes[newIndex];
            changeFontSize({target: fontSizeSelect});
        }
    }
}

// معالج أخطاء عام
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('حدث خطأ غير متوقع', 'error');
});

// معالج لرفوعات الوعود
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('حدث خطأ في النظام', 'error');
});