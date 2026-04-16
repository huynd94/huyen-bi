import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListOpenaiConversations, useCreateOpenaiConversation, useGetOpenaiConversation, useDeleteOpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, MessageSquarePlus, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useAISettings } from "@/contexts/ai-settings";

const SUGGESTED_QUESTIONS = [
  "Số vận mệnh 7 có ý nghĩa gì và hợp nghề nghiệp nào?",
  "Người sinh năm Giáp Tý có tính cách và vận mệnh ra sao?",
  "Quẻ Địa Thiên Thái có nghĩa gì khi hỏi về tình duyên?",
  "Số điện thoại kết thúc 8686 tốt hay xấu? Ý nghĩa từng số?",
  "Sao Thái Dương chiếu mệnh năm nay ảnh hưởng gì?",
  "Ngũ Hành Hỏa thiếu cần bổ sung màu sắc và vật phẩm gì?",
  "Người sinh giờ Ngọ tuổi Mùi tứ trụ thế nào?",
  "Cung Mệnh Thiên Đồng Cự Môn hội chiếu mang lại gì?",
  "Sao La Hầu chiếu cần hóa giải như thế nào?",
  "Đại Vận Kim có lợi hay bất lợi cho người mệnh Mộc?",
  "Hợp tuổi Dần và Ngọ có phải Tam Hợp không?",
  "Xem ngày cưới tháng 6 âm lịch ngày nào tốt nhất?",
  "Phong thuỷ hướng Tây Nam tốt cho người Mệnh Quái nào?",
  "Tên có tổng nét 25 theo Hán Tự mang vận khí gì?",
];

export default function AIChatPage() {
  const queryClient = useQueryClient();
  const { settings, activeKey, activeModel } = useAISettings();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<{role: string, content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: isLoadingConvs } = useListOpenaiConversations();
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();
  
  const { data: activeConvData, isLoading: isLoadingConvData } = useGetOpenaiConversation(activeConvId!, {
    query: { enabled: !!activeConvId }
  });

  useEffect(() => {
    if (activeConvData) setLocalMessages(activeConvData.messages || []);
  }, [activeConvData]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [localMessages]);

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "Trò chuyện mới" } }, {
      onSuccess: (newConv) => {
        queryClient.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
        setActiveConvId(newConv.id);
        setLocalMessages([]);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
        if (activeConvId === id) { setActiveConvId(null); setLocalMessages([]); }
      }
    });
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !activeConvId || isStreaming) return;
    setInput("");
    setLocalMessages(prev => [...prev, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      headers["x-ai-provider"] = settings.provider;
      // Không gửi key/model khi dùng server key
      if (settings.provider !== "server") {
        if (activeKey) headers["x-ai-key"] = activeKey;
        if (activeModel) headers["x-ai-model"] = activeModel;
      }

      const response = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: message }),
      });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.done) break;
            if (data.content) {
              setLocalMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === "assistant") last.content += data.content;
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: [`/api/openai/conversations/${activeConvId}`] });
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggest = (q: string) => {
    if (!activeConvId) {
      createConv.mutate({ data: { title: q.slice(0, 40) } }, {
        onSuccess: (newConv) => {
          queryClient.invalidateQueries({ queryKey: ["/api/openai/conversations"] });
          setActiveConvId(newConv.id);
          setLocalMessages([]);
          setTimeout(() => sendMessage(q), 200);
        }
      });
    } else {
      sendMessage(q);
    }
  };

  const providerLabel = settings.provider === "server"
    ? "Key hệ thống"
    : settings.provider === "gemini"
      ? `Gemini · ${activeModel}`
      : `GPT · ${activeModel}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />
      <Navbar />
      
      <main className="flex-1 flex pt-16 z-10 relative overflow-hidden h-[100dvh]">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-72" : "w-0"} border-r border-border/50 bg-card/20 backdrop-blur-md flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
          <div className="p-4 border-b border-border/50 space-y-2">
            <Button onClick={handleNewChat} className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 text-sm" disabled={createConv.isPending}>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Trò chuyện mới
            </Button>
            <div className="text-center text-[10px] text-muted-foreground/60 border border-border/30 rounded px-2 py-1">{providerLabel}</div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingConvs ? (
                <div className="text-center text-xs text-muted-foreground p-4">Đang tải...</div>
              ) : !conversations?.length ? (
                <div className="text-center text-xs text-muted-foreground p-4 opacity-60">Chưa có cuộc trò chuyện nào</div>
              ) : conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${activeConvId === conv.id ? "bg-primary/20 border border-primary/40" : "hover:bg-primary/10 border border-transparent"}`}
                >
                  <div className="truncate text-xs font-medium text-foreground/90">{conv.title}</div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0" onClick={(e) => handleDelete(e, conv.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background/50 min-w-0">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-background/60 backdrop-blur-sm">
            <button onClick={() => setSidebarOpen((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-primary/10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-sm text-muted-foreground">Trợ Lý Tâm Linh Huyền Bí</span>
          </div>

          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
              <div className="text-center space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-primary/80">智</span>
                </div>
                <h2 className="text-2xl font-bold text-primary">Trợ Lý Huyền Học AI</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">Đặt câu hỏi về thần số học, kinh dịch, lá số bát tự, tử vi hay bất kỳ điều gì về vận mệnh và tâm linh.</p>
              </div>

              <div className="w-full max-w-2xl space-y-3">
                <p className="text-xs text-center text-muted-foreground uppercase tracking-widest">Câu hỏi gợi ý</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggest(q)}
                      disabled={createConv.isPending}
                      className="text-left text-sm text-muted-foreground border border-border/40 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 rounded-xl px-4 py-3 transition-all duration-150 leading-snug"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                {isLoadingConvData ? (
                  <div className="text-center text-muted-foreground text-sm">Đang tải...</div>
                ) : localMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 gap-6">
                    <p className="text-sm text-muted-foreground">Câu hỏi gợi ý:</p>
                    <div className="grid sm:grid-cols-2 gap-2 max-w-xl">
                      {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                        <button key={q} onClick={() => handleSuggest(q)}
                          className="text-left text-xs text-muted-foreground border border-border/40 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 rounded-xl px-3 py-2 transition-all">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  localMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "user" ? (
                        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed bg-primary text-primary-foreground">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="max-w-[88%] rounded-2xl rounded-tl-sm px-5 py-4 bg-card/60 backdrop-blur-sm border border-primary/15 text-foreground">
                          {!msg.content && isStreaming && i === localMessages.length - 1 ? (
                            <div className="flex items-center gap-2 py-1">
                              <span className="text-xs text-muted-foreground">Đang suy nghĩ</span>
                              <div className="flex gap-1">
                                {[0, 150, 300].map((d) => (
                                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi về vận mệnh, thần số học, kinh dịch..."
                    className="flex-1 bg-card/50 border-primary/25 focus-visible:ring-primary h-12 rounded-full pr-4"
                    disabled={isStreaming || isLoadingConvData}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  />
                  <Button type="submit" size="icon" disabled={isStreaming || !input.trim()}
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
