(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/lib/supabaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://roljshfmfwrpaprmzhij.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvbGpzaGZtZndycGFwcm16aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDkwMTYsImV4cCI6MjA4MTY4NTAxNn0.V7LvIUa-VikstHBdAuSUdMzLepJ50dfWsGf-2brg_kA");
let supabaseInstance = null;
if ("TURBOPACK compile-time truthy", 1) {
    supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
} else //TURBOPACK unreachable
;
const supabase = supabaseInstance;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$basket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBasket$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/shopping-basket.js [app-client] (ecmascript) <export default as ShoppingBasket>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/list.js [app-client] (ecmascript) <export default as List>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smartphone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smartphone$3e$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/node_modules/lucide-react/dist/esm/icons/smartphone.js [app-client] (ecmascript) <export default as Smartphone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/lib/supabaseClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
function Home() {
    _s();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleSubscribe = async (e)=>{
        e.preventDefault();
        if (!email) return;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]) {
            alert("Configuração do Supabase pendente. Verifique o console ou contate o administrador.");
            console.warn("Supabase client is not initialized. Check your .env.local file.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('leads').insert([
                {
                    email,
                    created_at: new Date().toISOString()
                }
            ]);
            if (error) {
                throw error;
            }
            alert("Obrigado pelo interesse! Em breve entraremos em contato.");
            setEmail("");
        } catch (error) {
            console.error('Error adding lead:', error);
            alert("Erro ao salvar. Verifique se as chaves do Supabase estão configuradas.");
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-dark-bg text-gray-200 selection:bg-neon-green selection:text-black font-sans",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "fixed top-0 w-full z-50 bg-dark-bg/80 backdrop-blur-md border-b border-white/5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-6 h-16 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 text-white font-bold text-xl tracking-tighter",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-1 bg-neon-green rounded-lg",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$basket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBasket$3e$__["ShoppingBasket"], {
                                        className: "w-5 h-5 text-black"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "MENU LIST"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 51,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "text-sm font-medium hover:text-neon-green transition-colors",
                            children: "Login"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 53,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                    lineNumber: 46,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "pt-32 pb-20 px-6 relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-green/20 rounded-full blur-[100px] -z-10"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-4xl mx-auto text-center space-y-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight",
                                children: [
                                    "Economize ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-neon-green",
                                        children: "tempo"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                        lineNumber: 66,
                                        columnNumber: 23
                                    }, this),
                                    " e ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-neon-green",
                                        children: "dinheiro"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                        lineNumber: 66,
                                        columnNumber: 72
                                    }, this),
                                    " nas suas compras!"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-lg text-gray-400 max-w-2xl mx-auto",
                                children: "A maneira mais inteligente de organizar suas refeições. Planeje, economize e tenha controle total do seu carrinho."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubscribe,
                                className: "flex flex-col sm:flex-row gap-4 max-w-md mx-auto mt-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "email",
                                        placeholder: "Quer montar sua lista agora? Informe seu e-mail",
                                        className: "flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all",
                                        value: email,
                                        onChange: (e)=>setEmail(e.target.value),
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        className: "bg-neon-green text-black font-bold py-3 px-6 rounded-lg hover:shadow-[0_0_20px_rgba(46,204,113,0.4)] transition-all transform hover:-translate-y-1",
                                        children: "Criar Assinatura"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 72,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-20 px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureCard, {
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$basket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingBasket$3e$__["ShoppingBasket"], {}, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 96,
                                    columnNumber: 21
                                }, void 0),
                                title: "Várias Receitas",
                                description: "Tenha acesso a várias receitas deliciosas e práticas."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureCard, {
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smartphone$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smartphone$3e$__["Smartphone"], {}, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 101,
                                    columnNumber: 21
                                }, void 0),
                                title: "Controle Total",
                                description: "Tenha controle do que você está comendo e gastando."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureCard, {
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {}, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 106,
                                    columnNumber: 21
                                }, void 0),
                                title: "Consciência",
                                description: "Saiba o porquê você está comprando cada item."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 105,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FeatureCard, {
                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$list$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__List$3e$__["List"], {}, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 111,
                                    columnNumber: 21
                                }, void 0),
                                title: "Lista Inteligente",
                                description: "Lista melhor que nem IA consegue montar para você."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-20 px-6 bg-white/5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-3xl font-bold text-center text-white mb-12",
                            children: "Escolha o plano ideal para você"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PricingCard, {
                                    title: "Grátis",
                                    price: "R$ 0",
                                    features: [
                                        "Acesso básico",
                                        "1 lista de compras"
                                    ]
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 125,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PricingCard, {
                                    title: "Plano Simples",
                                    price: "R$ 39,90",
                                    period: "/mês",
                                    highlighted: true,
                                    features: [
                                        "2 aparelhos",
                                        "Contagem de calorias",
                                        "Soma de preços",
                                        "Receitas ilimitadas"
                                    ]
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 131,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PricingCard, {
                                    title: "Plano Premium",
                                    price: "R$ 59,90",
                                    period: "/mês",
                                    features: [
                                        "6 aparelhos",
                                        "Plano Familiar",
                                        "Todas as funções do Simples",
                                        "Suporte prioritário"
                                    ]
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                    lineNumber: 121,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-20 px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-3xl mx-auto space-y-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-3xl font-bold text-center text-white",
                            children: "Perguntas Frequentes"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 152,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FAQItem, {
                                    question: "O que é a MENU LIST?",
                                    answer: "A MENU LIST é um aplicativo que ajuda você a planejar suas refeições e gerar listas de compras inteligentes para economizar tempo e dinheiro."
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 154,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FAQItem, {
                                    question: "Como faço para cancelar?",
                                    answer: "Você pode cancelar sua assinatura a qualquer momento através das configurações do aplicativo, sem multas ou taxas."
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 155,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FAQItem, {
                                    question: "Quanto custa?",
                                    answer: "Temos um plano gratuito. O plano Simples custa R$ 39,90/mês e o Premium R$ 59,90/mês para toda a família."
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FAQItem, {
                                    question: "Quais tipos de listas consigo montar?",
                                    answer: "Você pode montar listas baseadas em receitas, listas avulsas, e listas compartilhadas com a família."
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                    lineNumber: 157,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                            lineNumber: 153,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                    lineNumber: 151,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "py-8 bg-black border-t border-white/10 text-center text-gray-500 text-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: [
                        "© ",
                        new Date().getFullYear(),
                        " MENU LIST. Todos os direitos reservados."
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                    lineNumber: 164,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 163,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(Home, "GJ4bGuor3Bl+gOvF0O6ErTtqrIU=");
_c = Home;
function FeatureCard({ icon, title, description }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-card-bg p-6 rounded-2xl border border-white/5 hover:border-neon-green/50 transition-colors group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-neon-green mb-4 group-hover:bg-neon-green group-hover:text-black transition-colors",
                children: icon
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xl font-bold text-white mb-2",
                children: title
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 176,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-400 text-sm",
                children: description
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
        lineNumber: 172,
        columnNumber: 5
    }, this);
}
_c1 = FeatureCard;
function PricingCard({ title, price, period = "", features, highlighted = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `rounded-2xl p-8 relative ${highlighted ? 'bg-card-bg border-2 border-neon-green shadow-glow transform md:-translate-y-4' : 'bg-card-bg/50 border border-white/10'}`,
        children: [
            highlighted && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-green text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                children: "Mais Popular"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 186,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg text-gray-400 mb-2",
                children: title
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end gap-1 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-4xl font-bold text-white",
                        children: price
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this),
                    period && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-500 text-sm mb-1",
                        children: period
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 193,
                        columnNumber: 20
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "space-y-4 text-sm text-gray-300 mb-8",
                children: features.map((feat, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                className: "w-4 h-4 text-neon-green"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                                lineNumber: 198,
                                columnNumber: 13
                            }, this),
                            feat
                        ]
                    }, i, true, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 197,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: `w-full py-3 rounded-lg font-bold transition-all ${highlighted ? 'bg-neon-green text-black hover:shadow-glow-hover' : 'bg-white/10 text-white hover:bg-white/20'}`,
                children: "Assinar Agora"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
        lineNumber: 184,
        columnNumber: 5
    }, this);
}
_c2 = PricingCard;
function FAQItem({ question, answer }) {
    _s1();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border-b border-white/10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "w-full py-4 flex items-center justify-between text-left focus:outline-none",
                onClick: ()=>setIsOpen(!isOpen),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium text-white",
                        children: question
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 218,
                        columnNumber: 9
                    }, this),
                    isOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                        className: "text-neon-green"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 219,
                        columnNumber: 19
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        className: "text-gray-500"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                        lineNumber: 219,
                        columnNumber: 63
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 214,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Downloads$2f$nutriplan$2d$pro$2f$menu$2d$list$2d$lp$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pb-4 text-gray-400 text-sm leading-relaxed",
                children: answer
            }, void 0, false, {
                fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
                lineNumber: 222,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Downloads/nutriplan-pro/menu-list-lp/app/page.tsx",
        lineNumber: 213,
        columnNumber: 5
    }, this);
}
_s1(FAQItem, "+sus0Lb0ewKHdwiUhiTAJFoFyQ0=");
_c3 = FAQItem;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Home");
__turbopack_context__.k.register(_c1, "FeatureCard");
__turbopack_context__.k.register(_c2, "PricingCard");
__turbopack_context__.k.register(_c3, "FAQItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=OneDrive_Downloads_nutriplan-pro_menu-list-lp_f52e6bc9._.js.map