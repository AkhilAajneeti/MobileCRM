// components/ui/Select.jsx - Shadcn style Select
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";
import Input from "./Input";

/**
 * On a phone the option list is presented as a bottom sheet rather than a
 * popover (spec 4.3) -- same surface tokens, sheet geometry from spec 6.
 * `md` (768px) is the same breakpoint the list view switches card/table at.
 */
const useIsMobileViewport = () => {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
    );

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const query = window.matchMedia("(max-width: 767px)");
        const onChange = (event) => setIsMobile(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    return isMobile;
};

const Select = React.forwardRef(({
    className,
    options = [],
    value,
    defaultValue,
    placeholder = "Select an option",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    searchable = false,
    clearable = false,
    loading = false,
    // When true, dropdown option labels wrap to multiple lines instead of
    // being truncated. Selected display still truncates so the trigger stays
    // clean. Default keeps existing behavior across the app.
    wrapOptions = false,
    // Extra Tailwind classes applied to the dropdown panel container — used
    // to widen the panel for long labels without affecting the trigger width.
    dropdownClassName = "",
    id,
    name,
    onChange,
    onOpenChange,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const isMobile = useIsMobileViewport();

    // Ref on the outer container — used by the click-outside listener to
    // detect whether a `mousedown` happened inside the select (trigger or
    // dropdown panel) or anywhere else on the page.
    const containerRef = useRef(null);

    // Close on outside click / Escape. Only attaches listeners while the
    // dropdown is open so there's zero runtime cost the rest of the time.
    // The trigger button itself is inside `containerRef`, so clicking it
    // doesn't trip the outside-click branch — `handleToggle` keeps owning
    // the open/close decision for trigger clicks.
    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
                setSearchTerm("");
                onOpenChange?.(false);
            }
        };

        // The mobile bottom sheet is portaled to document.body, so it sits
        // outside containerRef and would be treated as an outside click.
        // It brings its own tap-to-dismiss backdrop instead.
        if (!isMobile) {
            document.addEventListener("mousedown", handlePointerDown);
            document.addEventListener("touchstart", handlePointerDown);
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, isMobile, onOpenChange]);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Filter options based on search
    const filteredOptions = searchable && searchTerm
        ? options?.filter(option =>
            option?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
            (option?.value && option?.value?.toString()?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
        )
        : options;

    // Get selected option(s) for display
    const getSelectedDisplay = () => {
        if (!value) return placeholder;

        if (multiple) {
            const selectedOptions = options?.filter(opt => value?.includes(opt?.value));
            if (selectedOptions?.length === 0) return placeholder;
            if (selectedOptions?.length === 1) return selectedOptions?.[0]?.label;
            return `${selectedOptions?.length} items selected`;
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const handleToggle = () => {
        if (!disabled) {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            onOpenChange?.(newIsOpen);
            if (!newIsOpen) {
                setSearchTerm("");
            }
        }
    };

    const handleOptionSelect = (option) => {
        if (multiple) {
            const newValue = value || [];
            const updatedValue = newValue?.includes(option?.value)
                ? newValue?.filter(v => v !== option?.value)
                : [...newValue, option?.value];
            onChange?.(updatedValue);
        } else {
            onChange?.(option?.value);
            setIsOpen(false);
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e?.stopPropagation();
        onChange?.(multiple ? [] : '');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e?.target?.value);
    };

    const isSelected = (optionValue) => {
        if (multiple) {
            return value?.includes(optionValue) || false;
        }
        return value === optionValue;
    };

    const hasValue = multiple ? value?.length > 0 : value !== undefined && value !== '';

    /**
     * The option list. Shared verbatim by the desktop popover and the
     * mobile bottom sheet so the two can never drift apart. Rows are
     * min-h-[44px] to stay thumb-sized on a phone.
     */
    const menuBody = (
        <>
            {searchable && (
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search options..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 bg-input border-border"
                        />
                    </div>
                </div>
            )}

            <div className={cn("py-1 overflow-auto", !isMobile && "max-h-60")}>
                {filteredOptions?.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        {searchTerm ? 'No options found' : 'No options available'}
                    </div>
                ) : (
                    filteredOptions?.map((option) => (
                        <div
                            key={option?.value}
                            title={option?.label}
                            className={cn(
                                // Switch from `items-center` to `items-start`
                                // when wrapping so a 2-line label keeps the
                                // check icon aligned to the top of the row.
                                "relative flex cursor-pointer select-none rounded-md mx-1 px-3 text-sm outline-none transition-smooth active:bg-primary/10",
                                isMobile ? "min-h-[44px] py-3" : "py-2.5 hover:bg-primary/10 hover:text-primary",
                                wrapOptions ? "items-start" : "items-center",
                                isSelected(option?.value) && "bg-primary/20 text-primary font-medium",
                                option?.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !option?.disabled && handleOptionSelect(option)}
                        >
                            <span
                                className={cn(
                                    "flex-1",
                                    wrapOptions
                                        ? "whitespace-normal break-words leading-snug"
                                        : "truncate",
                                )}
                            >
                                {option?.label}
                            </span>
                            {isSelected(option?.value) && (
                                <Check className="h-4 w-4 ml-2 flex-shrink-0 text-primary" />
                            )}
                            {option?.description && (
                                <span className="text-[11px] text-muted-foreground ml-2 truncate max-w-24">
                                    {option?.description}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </>
    );

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
                        error ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    ref={ref}
                    id={selectId}
                    type="button"
                    // Native tooltip shows the full label on hover when the
                    // truncated trigger doesn't fit everything on screen.
                    title={hasValue ? getSelectedDisplay() : undefined}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-smooth shadow-elevation-1 hover:shadow-elevation-2",
                        error && "border-destructive focus:ring-destructive",
                        !hasValue && "text-muted-foreground"
                    )}
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    {...props}
                >
                    <span className="truncate">{getSelectedDisplay()}</span>

                    <div className="flex items-center gap-1">
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}

                        {clearable && hasValue && !loading && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 hover:bg-muted/50"
                                onClick={handleClear}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}

                        <ChevronDown className={cn("h-4 w-4 transition-smooth text-muted-foreground", isOpen && "rotate-180 text-primary")} />
                    </div>
                </button>

                {/* Hidden native select for form submission */}
                <select
                    name={name}
                    value={value || ''}
                    onChange={() => { }} // Controlled by our custom logic
                    className="sr-only"
                    tabIndex={-1}
                    multiple={multiple}
                    required={required}
                >
                    <option value="">Select...</option>
                    {options?.map(option => (
                        <option key={option?.value} value={option?.value}>
                            {option?.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown -- popover on desktop, bottom sheet on mobile */}
                {isOpen && (isMobile ? (
                    createPortal(
                        <div className="fixed inset-0 z-[70] md:hidden">
                            <div
                                className="absolute inset-0 bg-black/40 backdrop-blur-[3px] animate-fade-in"
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchTerm("");
                                    onOpenChange?.(false);
                                }}
                            />
                            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[28px] border-t border-border bg-background shadow-sheet motion-safe:animate-sheet-up">
                                {/* Grabber */}
                                <div className="flex shrink-0 justify-center pb-1 pt-3.5">
                                    <div className="h-1.5 w-11 rounded-full bg-foreground/15" />
                                </div>

                                <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2">
                                    <span className="truncate text-base font-semibold text-foreground">
                                        {label || placeholder}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setSearchTerm("");
                                            onOpenChange?.(false);
                                        }}
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-transform active:scale-95"
                                    >
                                        <X className="h-[18px] w-[18px]" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto overscroll-touch pb-safe">
                                    {menuBody}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                ) : (
                    <div className={cn(
                        "absolute z-50 w-full mt-2 bg-card text-card-foreground border border-border rounded-lg shadow-elevation-2 backdrop-blur-sm",
                        dropdownClassName,
                    )}>
                        {menuBody}
                    </div>
                ))}
            </div>
            {description && !error && (
                <p className="text-sm text-muted-foreground mt-2">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-sm text-destructive mt-2">
                    {error}
                </p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;