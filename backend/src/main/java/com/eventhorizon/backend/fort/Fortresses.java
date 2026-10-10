package com.eventhorizon.backend.fort;

import java.util.List;

/** The 21 fortress names exactly as they appear in "Suspicious Merchant" messages. */
public final class Fortresses {

    /** Declaration order is also the tie-break order in status listings (mirrors get_fortress_status.py). */
    public static final List<String> NAMES = List.of(
            "Крепость Черепахи",
            "Крепость Флорана",
            "Драконья Крепость",
            "Крепость Монахов",
            "Крепость Пограничья",
            "Крепость Антараса",
            "Южная Крепость",
            "Крепость Болота",
            "Крепость Танор",
            "Западная Крепость",
            "Крепость Гигантов",
            "Крепость Охотников",
            "Крепость Улья",
            "Заснеженная Крепость",
            "Крепость Аару",
            "Крепость Слоновой Кости",
            "Крепость Туманных Гор",
            "Крепость Нарсилл",
            "Укрепленный Лагерь",
            "Крепость Демона",
            "Крепость Белых Песков"
    );

    private Fortresses() {
    }
}
