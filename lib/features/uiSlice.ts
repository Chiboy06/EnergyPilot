import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    sidebarOpen: boolean;
    activeView: "dashboard" | "circuits" | "predictions" | "analytics" | "settings";
}

const initialState: UiState = {
    sidebarOpen: false,
    activeView: "dashboard",
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        toggleSidebar(state) {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen(state, action: PayloadAction<boolean>) {
            state.sidebarOpen = action.payload;
        },
        setActiveView(state, action: PayloadAction<UiState["activeView"]>) {
            state.activeView = action.payload;
        },
    },
});

export const { toggleSidebar, setSidebarOpen, setActiveView } = uiSlice.actions;
export default uiSlice.reducer;
