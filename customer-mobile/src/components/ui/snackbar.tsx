import { CheckCircle2, Info, XCircle } from "lucide-react-native";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, PanResponder, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SnackbarType = "success" | "error" | "info";

interface SnackbarItem {
  id: number;
  message: string;
  type: SnackbarType;
}

interface SnackbarContextValue {
  show: (message: string, type?: SnackbarType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
});

export function useSnackbar() {
  return useContext(SnackbarContext);
}

const DURATION = 2500;
const ANIM_MS = 200;

const TYPE_CONFIG: Record<
  SnackbarType,
  { bg: string; Icon: typeof CheckCircle2 }
> = {
  success: { bg: "#16a34a", Icon: CheckCircle2 },
  error: { bg: "#dc2626", Icon: XCircle },
  info: { bg: "#1e293b", Icon: Info },
};

let idCounter = 0;

function SnackbarToast({
  item,
  onDone,
}: {
  item: SnackbarItem;
  onDone: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(
    (toX = 0) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: toX,
          duration: ANIM_MS,
          useNativeDriver: true,
        }),
      ]).start(onDone);
    },
    [opacity, translateX, onDone],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 80) {
          dismiss(g.dx > 0 ? 400 : -400);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useState(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
    timerRef.current = setTimeout(() => dismiss(), DURATION);
  });

  const config = TYPE_CONFIG[item.type];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        opacity,
        transform: [{ translateY }, { translateX }],
        marginTop: 8,
      }}
    >
      <View
        style={{
          backgroundColor: config.bg,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <config.Icon size={18} color="#fff" strokeWidth={2.5} />
        <Text
          style={{
            flex: 1,
            color: "#fff",
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          {item.message}
        </Text>
      </View>
    </Animated.View>
  );
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<SnackbarItem[]>([]);

  const show = useCallback((message: string, type: SnackbarType = "info") => {
    const id = ++idCounter;
    setQueue((q) => [...q, { id, message, type }]);
  }, []);

  const removeItem = useCallback((id: number) => {
    setQueue((q) => q.filter((item) => item.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider
      value={{
        show,
        success: (msg) => show(msg, "success"),
        error: (msg) => show(msg, "error"),
      }}
    >
      {children}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 55,
          left: 16,
          right: 16,
        }}
        pointerEvents="box-none"
      >
        {queue.map((item) => (
          <SnackbarToast
            key={item.id}
            item={item}
            onDone={() => removeItem(item.id)}
          />
        ))}
      </View>
    </SnackbarContext.Provider>
  );
}
